#!/usr/bin/env python3
"""Train AgriSathi's 14-class MobileNetV2 plant-disease classifier.

The script extracts frozen ImageNet features once, trains a compact classifier
head, evaluates it on the held-out test split, and exports one self-contained
Keras model that accepts RGB images with pixel values in the 0-255 range.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import time
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report


ROOT = Path(__file__).resolve().parent
DEFAULT_DATASET = ROOT / "dataset"
DEFAULT_MODEL = ROOT / "agri_sarthi_model.keras"
DEFAULT_METADATA = ROOT / "model_metadata.json"
DEFAULT_CLASS_INDICES = ROOT / "class_indices.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--metadata", type=Path, default=DEFAULT_METADATA)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--patience", type=int, default=5)
    parser.add_argument("--seed", type=int, default=1736)
    parser.add_argument("--force-features", action="store_true")
    return parser.parse_args()


def configure_runtime(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    try:
        tf.config.threading.set_inter_op_parallelism_threads(4)
        tf.config.threading.set_intra_op_parallelism_threads(8)
    except RuntimeError:
        pass


def read_class_names() -> list[str]:
    mapping = json.loads(DEFAULT_CLASS_INDICES.read_text(encoding="utf-8"))
    return [name for name, _index in sorted(mapping.items(), key=lambda item: item[1])]


def make_dataset(
    directory: Path,
    class_names: list[str],
    batch_size: int,
    shuffle: bool,
    seed: int,
) -> tf.data.Dataset:
    dataset = tf.keras.utils.image_dataset_from_directory(
        directory,
        labels="inferred",
        label_mode="categorical",
        class_names=class_names,
        image_size=(224, 224),
        batch_size=batch_size,
        shuffle=shuffle,
        seed=seed,
    )
    return dataset.prefetch(tf.data.AUTOTUNE)


def feature_cache_path(dataset_dir: Path, split: str) -> Path:
    cache_dir = ROOT / ".feature-cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir / f"mobilenetv2-224-{split}.npz"


def extract_features(
    dataset: tf.data.Dataset,
    feature_extractor: tf.keras.Model,
    cache_path: Path,
    force: bool,
) -> tuple[np.ndarray, np.ndarray]:
    if cache_path.exists() and not force:
        print(f"Loading cached features: {cache_path.name}", flush=True)
        cached = np.load(cache_path)
        return cached["features"], cached["labels"]

    feature_batches: list[np.ndarray] = []
    label_batches: list[np.ndarray] = []
    total_batches = int(tf.data.experimental.cardinality(dataset).numpy())
    started = time.time()

    for batch_number, (images, labels) in enumerate(dataset, start=1):
        feature_batches.append(feature_extractor(images, training=False).numpy())
        label_batches.append(labels.numpy())
        if batch_number == 1 or batch_number % 25 == 0 or batch_number == total_batches:
            elapsed = time.time() - started
            print(
                f"  extracted {batch_number}/{total_batches} batches "
                f"({elapsed:.0f}s)",
                flush=True,
            )

    features = np.concatenate(feature_batches).astype(np.float32)
    labels = np.concatenate(label_batches).astype(np.float32)
    np.savez_compressed(cache_path, features=features, labels=labels)
    print(f"Saved feature cache: {cache_path}", flush=True)
    return features, labels


def build_head(num_classes: int) -> tf.keras.Model:
    inputs = tf.keras.Input(shape=(1280,), name="mobilenet_features")
    x = tf.keras.layers.BatchNormalization()(inputs)
    x = tf.keras.layers.Dense(512, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="disease_probabilities")(x)
    model = tf.keras.Model(inputs, outputs, name="agrisathi_classifier_head")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def class_weights(labels: np.ndarray) -> dict[int, float]:
    indices = np.argmax(labels, axis=1)
    counts = np.bincount(indices, minlength=labels.shape[1])
    total = counts.sum()
    weights = total / (len(counts) * np.maximum(counts, 1))
    return {index: float(weight) for index, weight in enumerate(weights)}


def combine_model(feature_base: tf.keras.Model, head: tf.keras.Model) -> tf.keras.Model:
    image = tf.keras.Input(shape=(224, 224, 3), dtype=tf.float32, name="plant_image")
    normalized = tf.keras.layers.Rescaling(
        scale=1.0 / 127.5,
        offset=-1.0,
        name="mobilenet_preprocessing",
    )(image)
    features = feature_base(normalized, training=False)
    predictions = head(features, training=False)
    return tf.keras.Model(image, predictions, name="agri_sarthi_mobilenet_v2")


def main() -> None:
    args = parse_args()
    configure_runtime(args.seed)
    class_names = read_class_names()
    print(f"TensorFlow {tf.__version__}; classes: {len(class_names)}", flush=True)

    for split in ("train", "val", "test"):
        split_dir = args.dataset / split
        if not split_dir.is_dir():
            raise FileNotFoundError(f"Missing dataset split: {split_dir}")

    train_ds = make_dataset(args.dataset / "train", class_names, args.batch_size, True, args.seed)
    val_ds = make_dataset(args.dataset / "val", class_names, args.batch_size, False, args.seed)
    test_ds = make_dataset(args.dataset / "test", class_names, args.batch_size, False, args.seed)

    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet",
        pooling="avg",
    )
    base.trainable = False
    base_input = tf.keras.Input(shape=(224, 224, 3), dtype=tf.float32)
    preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(base_input)
    feature_extractor = tf.keras.Model(base_input, base(preprocessed, training=False))

    train_features, train_labels = extract_features(
        train_ds,
        feature_extractor,
        feature_cache_path(args.dataset, "train"),
        args.force_features,
    )
    val_features, val_labels = extract_features(
        val_ds,
        feature_extractor,
        feature_cache_path(args.dataset, "val"),
        args.force_features,
    )
    test_features, test_labels = extract_features(
        test_ds,
        feature_extractor,
        feature_cache_path(args.dataset, "test"),
        args.force_features,
    )

    head = build_head(len(class_names))
    checkpoint = ROOT / ".feature-cache" / "best-head.keras"
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=args.patience,
            mode="max",
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.4,
            patience=2,
            min_lr=1e-6,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            checkpoint,
            monitor="val_accuracy",
            mode="max",
            save_best_only=True,
        ),
    ]

    history = head.fit(
        train_features,
        train_labels,
        validation_data=(val_features, val_labels),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weights(train_labels),
        callbacks=callbacks,
        verbose=2,
    )
    head = tf.keras.models.load_model(checkpoint)

    probabilities = head.predict(test_features, batch_size=args.batch_size, verbose=0)
    actual = np.argmax(test_labels, axis=1)
    predicted = np.argmax(probabilities, axis=1)
    test_accuracy = float(np.mean(actual == predicted))
    report = classification_report(
        actual,
        predicted,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    model = combine_model(base, head)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.output)

    best_val_accuracy = float(max(history.history["val_accuracy"]))
    metadata = {
        "name": "AgriSathi MobileNetV2 Plant Disease Classifier",
        "version": "1.0.0",
        "architecture": "MobileNetV2 transfer learning",
        "inputSize": [224, 224, 3],
        "classes": class_names,
        "classIndices": {name: index for index, name in enumerate(class_names)},
        "trainingSamples": int(len(train_features)),
        "validationSamples": int(len(val_features)),
        "testSamples": int(len(test_features)),
        "bestValidationAccuracy": best_val_accuracy,
        "testAccuracy": test_accuracy,
        "epochsCompleted": len(history.history["loss"]),
        "classificationReport": report,
    }
    args.metadata.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Saved model: {args.output}", flush=True)
    print(f"Validation accuracy: {best_val_accuracy:.4f}", flush=True)
    print(f"Test accuracy: {test_accuracy:.4f}", flush=True)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Minimal local HTTP inference server for AgriSathi's Keras model."""

from __future__ import annotations

import argparse
import io
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--metadata", type=Path, required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=5055)
    return parser.parse_args()


class InferenceApplication:
    def __init__(self, model_path: Path, metadata_path: Path) -> None:
        self.model_path = model_path
        self.metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        self.class_names = self.metadata["classes"]
        self.model = tf.keras.models.load_model(model_path, compile=False)

    def predict(self, payload: bytes) -> dict:
        try:
            image = Image.open(io.BytesIO(payload)).convert("RGB")
        except (UnidentifiedImageError, OSError) as error:
            raise ValueError("The uploaded file is not a readable image") from error

        image = image.resize((224, 224), Image.Resampling.LANCZOS)
        batch = np.expand_dims(np.asarray(image, dtype=np.float32), axis=0)
        probabilities = self.model.predict(batch, verbose=0)[0]
        top_indices = np.argsort(probabilities)[::-1][:3]

        return {
            "className": self.class_names[int(top_indices[0])],
            "confidence": round(float(probabilities[top_indices[0]]) * 100, 2),
            "topPredictions": [
                {
                    "className": self.class_names[int(index)],
                    "confidence": round(float(probabilities[index]) * 100, 2),
                }
                for index in top_indices
            ],
        }


def make_handler(application: InferenceApplication):
    class Handler(BaseHTTPRequestHandler):
        server_version = "AgriSathiML/1.0"

        def send_json(self, status: int, payload: dict) -> None:
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:  # noqa: N802
            if self.path != "/health":
                return self.send_json(404, {"success": False, "message": "Not found"})
            return self.send_json(
                200,
                {
                    "success": True,
                    "provider": "Local MobileNetV2",
                    "model": application.metadata.get("name"),
                    "version": application.metadata.get("version"),
                    "testAccuracy": application.metadata.get("testAccuracy"),
                    "classes": len(application.class_names),
                },
            )

        def do_POST(self) -> None:  # noqa: N802
            if self.path != "/predict":
                return self.send_json(404, {"success": False, "message": "Not found"})

            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > 8 * 1024 * 1024:
                return self.send_json(400, {"success": False, "message": "Image must be between 1 byte and 8 MB"})

            try:
                prediction = application.predict(self.rfile.read(content_length))
                return self.send_json(200, {"success": True, "data": prediction})
            except ValueError as error:
                return self.send_json(400, {"success": False, "message": str(error)})
            except Exception as error:  # pragma: no cover - defensive service boundary
                print(f"Prediction error: {error}", flush=True)
                return self.send_json(500, {"success": False, "message": "Prediction failed"})

        def log_message(self, _format: str, *_args) -> None:
            return

    return Handler


def main() -> None:
    args = parse_args()
    if not args.model.is_file():
        raise FileNotFoundError(f"Model artifact not found: {args.model}")
    if not args.metadata.is_file():
        raise FileNotFoundError(f"Model metadata not found: {args.metadata}")

    print(f"Loading model from {args.model}...", flush=True)
    application = InferenceApplication(args.model, args.metadata)
    server = ThreadingHTTPServer((args.host, args.port), make_handler(application))
    print(f"AgriSathi local ML ready at http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()

import React, { useEffect, useRef, useState } from 'react';
import {
  FiActivity, FiAlertCircle, FiCamera, FiCheck, FiCheckCircle, FiDroplet,
  FiImage, FiLock, FiRefreshCw, FiSun, FiTarget, FiUploadCloud, FiX
} from 'react-icons/fi';
import config from '../config/config';
import '../styles/PlantScanner.css';

const scanStages = [
  'Checking image quality',
  'Finding plant patterns',
  'Comparing visible symptoms',
  'Preparing your care plan'
];

function PlantScanner() {
  const inputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const resultRef = useRef(null);
  const scanIdRef = useRef(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState(null);
  const [available, setAvailable] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const checkService = () => fetch(config.getApiUrl(config.endpoints.scanner.status))
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setAvailable(Boolean(data.data?.available));
        setService(data.data || null);
      })
      .catch(() => { if (!cancelled) setAvailable(false); });
    checkService();
    const timer = window.setInterval(checkService, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    if (!loading) return undefined;
    setStage(0);
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, scanStages.length - 1)), 850);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!result) return;
    window.requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 860px)').matches) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else resultRef.current?.focus({ preventScroll: true });
    });
  }, [result]);

  const analyze = async (imageFile = file) => {
    if (!imageFile) return;
    const scanId = ++scanIdRef.current;
    setLoading(true);
    setError('');
    setResult(null);
    const body = new FormData();
    body.append('image', imageFile);
    try {
      const response = await fetch(config.getApiUrl(config.endpoints.scanner.analyze), {
        method: 'POST',
        credentials: 'include',
        body
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Analysis failed');
      if (scanId === scanIdRef.current) setResult(data.data);
    } catch (scanError) {
      if (scanId === scanIdRef.current) setError(scanError.message);
    } finally {
      if (scanId === scanIdRef.current) setLoading(false);
    }
  };

  const selectFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) return setError('Choose a JPG, PNG or WebP image.');
    if (selected.size > 8 * 1024 * 1024) return setError('Image must be smaller than 8 MB.');
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError('');
    analyze(selected);
  };

  const reset = () => {
    scanIdRef.current += 1;
    setFile(null);
    setPreview('');
    setResult(null);
    setLoading(false);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const healthClass = result?.healthStatus?.toLowerCase().replaceAll(' ', '-') || '';
  const confidence = Math.max(0, Math.min(100, Number(result?.confidence) || 0));

  return (
    <div className="scanner-page page-shell">
      <header className="scanner-heading">
        <div><span className="eyebrow">Visual crop intelligence</span><h1>See what your plant is telling you.</h1><p>One clear leaf photo becomes an immediate health assessment and practical care plan.</p></div>
        <span className={`service-pill ${available ? 'online' : 'offline'}`}>
          {available ? <FiCheckCircle /> : <FiAlertCircle />}
          <span><strong>{available === null ? 'Checking model' : available ? 'Scanner ready' : service?.localModel?.trained ? 'Model starting' : 'Scanner offline'}</strong><small>{available ? service?.provider || 'Local + AI fallback' : 'Check backend service'}</small></span>
        </span>
      </header>

      <section className={`scanner-studio ${preview ? 'has-image' : 'is-empty'}`}>
        <div className="capture-panel">
          {!preview ? (
            <div
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}
            >
              <span className="capture-orbit orbit-large" /><span className="capture-orbit orbit-small" />
              <span className="upload-icon"><FiTarget /></span>
              <span className="upload-step">STEP 01 / CAPTURE</span>
              <h2>Place one leaf in focus.</h2>
              <p>Use a sharp, well-lit photo with the leaf filling most of the frame.</p>
              <div className="capture-actions">
                <button className="button scanner-primary" onClick={() => inputRef.current?.click()}><FiImage /> Choose photo</button>
                <button className="button scanner-secondary" onClick={() => cameraInputRef.current?.click()}><FiCamera /> Use camera</button>
              </div>
              <small><FiActivity /> Analysis starts automatically · JPG, PNG or WebP · 8 MB max</small>
            </div>
          ) : (
            <div className="image-stage">
              <img src={preview} alt="Plant selected for health analysis" />
              <div className="image-vignette" />
              <div className="image-meta"><span><FiImage /> {file?.name}</span><button onClick={reset} title="Remove image"><FiX /></button></div>
              {loading && <div className="scan-line" aria-hidden="true" />}
              <div className="image-controls">
                <button onClick={() => inputRef.current?.click()}><FiRefreshCw /> Replace</button>
                {!loading && <button className="reanalyze" onClick={() => analyze()}><FiActivity /> Analyze again</button>}
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onClick={(event) => { event.currentTarget.value = ''; }} onChange={(event) => selectFile(event.target.files[0])} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onClick={(event) => { event.currentTarget.value = ''; }} onChange={(event) => selectFile(event.target.files[0])} />
        </div>

        <div className="insight-panel" aria-live="polite">
          {!preview && (
            <div className="scan-onboarding">
              <div className="onboarding-top"><span className="eyebrow">Before you scan</span><span>Apple + Tomato</span></div>
              <h2>A better photo creates a better answer.</h2>
              <div className="photo-guides">
                <div><span>01</span><strong>One leaf</strong><p>Keep the affected leaf centered and large.</p></div>
                <div><span>02</span><strong>Soft daylight</strong><p>Avoid harsh flash, shadows and color filters.</p></div>
                <div><span>03</span><strong>Show symptoms</strong><p>Make spots, edges and texture easy to see.</p></div>
              </div>
              <p className="privacy-note"><FiLock /> Your photo is processed for this assessment and is not saved by AgriSathi.</p>
            </div>
          )}

          {preview && loading && (
            <div className="analysis-progress">
              <div className="analysis-radar"><FiActivity /><span /><i /></div>
              <span className="upload-step">STEP 02 / ANALYZE</span>
              <h2>{scanStages[stage]}…</h2>
              <p>The scanner is reading color, texture and visible symptom patterns.</p>
              <div className="stage-list">
                {scanStages.map((item, index) => <div key={item} className={index < stage ? 'done' : index === stage ? 'active' : ''}><span>{index < stage ? <FiCheck /> : index + 1}</span>{item}</div>)}
              </div>
            </div>
          )}

          {preview && error && !loading && (
            <div className="analysis-error">
              <span className="error-icon"><FiAlertCircle /></span><span className="upload-step">SCAN INTERRUPTED</span><h2>We couldn’t complete this assessment.</h2><p>{error}</p>
              <div><button className="button scanner-primary" onClick={() => analyze()}><FiRefreshCw /> Try again</button><button className="button scanner-secondary" onClick={reset}>Choose another photo</button></div>
            </div>
          )}

          {result && !loading && (
            <article className="scan-result" ref={resultRef} tabIndex="-1">
              <div className="result-topline"><span className="upload-step">STEP 03 / CARE PLAN</span><span className="result-provider">{result.provider || 'AgriSathi vision model'}</span></div>
              <div className="diagnosis-hero">
                <div><span className="plant-label">{result.plantName}</span><h2>{result.disease || result.healthStatus}</h2><p>{result.scientificName}</p></div>
                <div className={`confidence-dial ${healthClass}`} style={{ '--confidence': `${confidence}%` }}><div><strong>{confidence}%</strong><span>{result.healthStatus}</span></div></div>
              </div>

              <div className="result-sections">
                <section className="result-block symptoms"><h3><FiTarget /> What the model noticed</h3><ul>{result.symptoms?.map((item) => <li key={item}>{item}</li>)}</ul></section>
                <section className="care-vitals"><h3>Care conditions</h3><div><p><FiDroplet /><span><small>Water</small>{result.care?.watering}</span></p><p><FiSun /><span><small>Light</small>{result.care?.sunlight}</span></p></div><p className="soil-line"><strong>Soil</strong>{result.care?.soil}</p></section>
                <section className="result-block treatment"><h3><FiCheckCircle /> Recommended next steps</h3><ol>{result.treatment?.map((item) => <li key={item}>{item}</li>)}</ol></section>
                <details className="prevention-details"><summary>Long-term prevention <span>+</span></summary><ul>{result.prevention?.map((item) => <li key={item}>{item}</li>)}</ul></details>
              </div>
              <p className="result-disclaimer"><FiAlertCircle /> {result.disclaimer}</p>
              <button className="scan-another" onClick={reset}><FiRefreshCw /> Scan another plant</button>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

export default PlantScanner;

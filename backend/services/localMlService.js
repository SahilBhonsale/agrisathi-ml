const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const MODEL_PATH = path.resolve(process.env.LOCAL_ML_MODEL_PATH || path.join(PROJECT_ROOT, 'model', 'agri_sarthi_model.keras'));
const METADATA_PATH = path.resolve(process.env.LOCAL_ML_METADATA_PATH || path.join(PROJECT_ROOT, 'model', 'model_metadata.json'));
const SERVER_SCRIPT = path.join(PROJECT_ROOT, 'model', 'inference_server.py');
const PORT = Number(process.env.LOCAL_ML_PORT || 5055);
const BASE_URL = `http://127.0.0.1:${PORT}`;

let childProcess = null;

const findPython = () => {
  const candidates = [
    process.env.ML_PYTHON_PATH,
    path.join(PROJECT_ROOT, '.venv-ml', 'bin', 'python'),
    '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3',
    'python3'
  ].filter(Boolean);

  return candidates.find((candidate) => !candidate.includes(path.sep) || fs.existsSync(candidate));
};

const modelArtifactExists = () => fs.existsSync(MODEL_PATH) && fs.existsSync(METADATA_PATH);

const start = () => {
  if (childProcess || !modelArtifactExists()) {
    if (!modelArtifactExists()) {
      console.log('🧠 Local ML model not trained yet; scanner fallback will be used');
    }
    return childProcess;
  }

  const python = findPython();
  if (!python) {
    console.warn('⚠️ Compatible Python runtime not found; local ML scanner is unavailable');
    return null;
  }

  childProcess = spawn(python, [
    SERVER_SCRIPT,
    '--model', MODEL_PATH,
    '--metadata', METADATA_PATH,
    '--port', String(PORT)
  ], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, TF_CPP_MIN_LOG_LEVEL: '2', PYTHONUNBUFFERED: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  childProcess.stdout.on('data', (chunk) => console.log(`🧠 ${chunk.toString().trim()}`));
  childProcess.stderr.on('data', (chunk) => console.error(`🧠 ${chunk.toString().trim()}`));
  childProcess.on('exit', (code, signal) => {
    if (code && code !== 0) {
      console.error(`🧠 Local ML service exited with code ${code}${signal ? ` (${signal})` : ''}`);
    }
    childProcess = null;
  });

  return childProcess;
};

const stop = () => {
  if (childProcess && !childProcess.killed) {
    childProcess.kill('SIGTERM');
  }
  childProcess = null;
};

const health = async () => {
  if (!modelArtifactExists()) {
    return { available: false, reason: 'model-not-trained' };
  }

  try {
    const response = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1500) });
    if (!response.ok) throw new Error(`Health check returned ${response.status}`);
    return { available: true, ...(await response.json()) };
  } catch (_error) {
    return { available: false, reason: 'service-starting' };
  }
};

const predict = async (buffer, mimeType) => {
  const response = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': mimeType || 'application/octet-stream' },
    body: buffer,
    signal: AbortSignal.timeout(30000)
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Local ML prediction failed');
  }
  return payload.data;
};

module.exports = {
  start,
  stop,
  health,
  predict,
  modelArtifactExists
};

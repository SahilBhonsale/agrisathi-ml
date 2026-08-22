# AgriSathi

AgriSathi is a full-stack agricultural assistance platform that brings crop diagnosis, practical guidance, community knowledge, and local trade into one responsive web application. It includes a plant-health scanner, an AI farming assistant, a crop library, live weather, a community discussion forum, an agricultural marketplace, Google sign-in, user profiles, and an administrator dashboard.

## Technology

- **Frontend:** React 19, Vite, React Router, Axios, Recharts, Leaflet, and custom responsive CSS
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT authentication, and Google OAuth
- **AI:** a local 14-class MobileNetV2 plant-disease model with Gemini Vision fallback, plus a Gemini-powered agricultural chatbot
- **Deployment:** Vercel serves the Vite frontend and Express API from one domain; MongoDB Atlas provides production storage

## Project structure

```text
api/             Vercel serverless API entry point
backend/         Express API, MongoDB models, routes, services, and seed data
frontend/        React application and UI assets
model/           ML inference/training code, metadata, and trained model
demo-images/     Scanner demonstration images
vercel.json      Production build, function, and rewrite configuration
```

The large training datasets are intentionally excluded from Git. Place PlantVillage-compatible Apple and Tomato class folders under `model/dataset/` when retraining; the trained `model/agri_sarthi_model.keras` file is included for local inference.

## Run locally

Requirements: Node.js 22, MongoDB, and—only for local ML inference or retraining—Python 3.12.

```bash
# From the repository root
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Optional: install the local ML runtime
python3.12 -m venv .venv-ml
.venv-ml/bin/python -m pip install -r model/requirements-ml.txt

# Terminal 1
npm run start --workspace backend

# Terminal 2
npm run dev --workspace frontend
```

Open `http://localhost:5173`. Use `localhost`, rather than `127.0.0.1`, when testing Google sign-in. Configure real values in the two local `.env` files; they are ignored by Git.

For a reliable scanner demo, upload `demo-images/tomato-early-blight-model-sample.jpg`. The local model recognizes four Apple classes and ten Tomato classes. If local inference is unavailable or confidence is below the configured threshold, Gemini Vision is used when `GEMINI_API_KEY` is present.

## Production deployment

Import this repository into Vercel and keep the repository root as the project root. The included `vercel.json` runs the frontend build and routes `/api/*` to the Express function.

Configure these environment variables for Production, Preview, and Development as appropriate:

```dotenv
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
GEMINI_API_KEY=
SEED_ADMIN_PASSWORD=
NODE_ENV=production
```

`VITE_API_BASE_URL` should remain empty in production so the browser uses the same Vercel domain. Add the final Vercel domain to the authorized JavaScript origins for the Google OAuth web client. Never commit real API keys, database credentials, or JWT secrets.

## Useful commands

```bash
npm run build
npm run lint --workspace frontend
npm run seed --workspace backend
.venv-ml/bin/python model/train_model.py
```

Local demo administrator credentials default to `admin@agrisathi.local` / `AgriSathi@123`. Set a strong `SEED_ADMIN_PASSWORD` for any public deployment.

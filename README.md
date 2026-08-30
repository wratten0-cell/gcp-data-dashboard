# GCP Intelligent Data Dashboard & AI/ML Platform

A full-stack, enterprise analytics platform built with **React (Vite + Tailwind CSS + Apache ECharts)** and **FastAPI**, natively connected to **Google Cloud Platform (BigQuery, Vertex AI, and Gemini)**.

---

## Key Features

1. **Enterprise Data Dashboard**:
   - Real-time KPI summary cards with trend indicators and sparklines.
   - Interactive Apache ECharts visualizations (Dual-axis time-series, categorical distribution donuts, scatter correlations, regional maps).
   - Data exploration table with search, category filtering, risk score progress bars, pagination, and slide-in row inspection panel.
   - Dark and Light mode support with persistent theme switching.

2. **Gemini Conversational Data Assistant (NL-to-Insights)**:
   - Server-Sent Events (SSE) streaming for low-latency multi-turn chat.
   - Segregation of step-by-step reasoning (`THOUGHT`) from final formatted markdown answers.
   - Live BigQuery SQL generation with embedded execution preview cards and instant "Execute SQL" testing.
   - Dynamic follow-up suggestion chips.

3. **GCP AI/ML Studio & Model Execution Workbench**:
   - **Time-Series Forecasting**: Execute BigQuery ML `AI.FORECAST` / `ARIMA_PLUS` models with customizable horizons and 95% confidence intervals.
   - **Anomaly Detection**: Trigger BigQuery ML `AI.DETECT_ANOMALIES` with sensitivity controls, visual anomaly flags, and flagged incident breakdown tables.
   - **Key Driver Analysis**: Run `AI.KEY_DRIVERS` / `ML.CONTRIBUTION_ANALYSIS` to isolate causal factors and feature importance weights.
   - **Vertex AI Custom Endpoints**: Predict real-time Customer Lifetime Value (LTV) and risk scores.

4. **Dynamic Text-to-Dashboard Generator**:
   - Plain-text prompt to full dashboard generator (e.g. *"Show standard deviation of revenue, or compare Ground Advantage vs Priority Mail"*).
   - AI synthesizes BigQuery SQL, KPIs, and ECharts visual configurations dynamically, rendering a brand new interactive dashboard tab on the fly.

5. **Dual-Mode Engine (Live GCP + Demo Sandbox)**:
   - Connects directly to Google BigQuery and Vertex AI using GCP Application Default Credentials (ADC) or Service Account keys.
   - Built-in enterprise sandbox with realistic data for immediate testing without requiring GCP credentials upfront.

---

## Project Structure

```
gcp-data-dashboard/
├── .github/
│   └── workflows/
│       └── deploy-to-cloud-run.yml    # Automated CI/CD pipeline for Cloud Run
├── backend/
│   ├── app/
│   │   ├── config.py                  # GCP & Gemini settings
│   │   ├── main.py                    # FastAPI entrypoint & SPA static router
│   │   ├── data/
│   │   │   └── sample_datasets.py     # Sandbox data generator
│   │   ├── routers/
│   │   │   ├── chat.py                # SSE streaming chat endpoint
│   │   │   ├── dashboards.py          # Dynamic text-to-dashboard endpoints
│   │   │   ├── gcp.py                 # GCP connection & config endpoints
│   │   │   ├── models.py              # BigQuery ML / Vertex AI execution
│   │   │   └── query.py               # BigQuery SQL query executor
│   │   └── services/
│   │       ├── gcp_service.py         # BigQuery client & data manager
│   │       ├── gemini_service.py      # Gemini streaming & reasoning
│   │       ├── ml_models_service.py   # AI/ML model execution
│   │       └── dashboard_generator_service.py # Text-to-dashboard engine
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/                  # AI chat drawer, messages, SQL cards
│   │   │   ├── dashboard/             # KPI grid, ECharts cards, tables, detail panel
│   │   │   ├── generator/             # Text-to-Dashboard modal & dynamic views
│   │   │   ├── layout/                # Header, Sidebar, Navigation
│   │   │   ├── models/                # ML Workbench, Forecast & Anomaly views
│   │   │   └── settings/              # GCP config modal
│   │   ├── context/                   # AppContext & ThemeContext
│   │   ├── services/                  # REST API & SSE streaming clients
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── Dockerfile                         # Multi-stage production container
├── docker-compose.yml                 # Local multi-service development
├── cloudbuild.yaml                    # Google Cloud Build configuration
├── deploy.sh                          # Cloud Run deployment script (Bash)
├── deploy.ps1                         # Cloud Run deployment script (PowerShell)
└── README.md
```

---

## Quick Start (Local Development)

### Option 1: Using Docker Compose
```bash
docker compose up --build
```
- Open [http://localhost:5173](http://localhost:5173) for the frontend.
- Backend API runs on [http://localhost:8000](http://localhost:8000).

### Option 2: Running Locally (Node + Python)

1. **Start Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Deployment to Google Cloud Run

### Option A: One-Click Script
```bash
# Set your GCP Project ID
export GCP_PROJECT_ID="your-project-id"

# Run the deployment script
chmod +x deploy.sh
./deploy.sh
```

### Option B: Google Cloud Build CI/CD
```bash
gcloud builds submit --config=cloudbuild.yaml .
```

---

## Storing Code on GitHub & Automated CI/CD

To store this code on your GitHub repository:

1. **Initialize Git in the project directory**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of GCP Data Dashboard & AI/ML Platform"
   ```

2. **Create a new repository on GitHub**, then push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

3. **Automated Cloud Run Deployment via GitHub Actions**:
   - Go to your GitHub repository **Settings > Secrets and variables > Actions**.
   - Add the following repository secrets:
     - `GCP_PROJECT_ID`: Your GCP project ID.
     - `GCP_SA_KEY`: The JSON key of a service account with Cloud Run Admin, Artifact Registry Writer, and Service Account User roles.
   - Every time you push to the `main` branch, GitHub Actions will automatically build the container and deploy it to Google Cloud Run!

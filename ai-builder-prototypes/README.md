# BorderLens AI and ComparableScreen AI

Two understandable TypeScript prototypes for an AI-builder competition. They run completely in `MOCK_AI=true` mode, while the server can call Gemini when `MOCK_AI=false` and `GEMINI_API_KEY` are supplied.

## Product 1: BorderLens AI

Creates a canonical cross-border transaction from invoice, customs, ERP and agreement facts. Deterministic TypeScript checks values and Incoterms. Gemini is used only to improve explanations; the evidence and calculations remain controlled.

## Product 2: ComparableScreen AI

Applies deterministic independence, revenue, geography and data-availability filters, followed by an explainable activity-keyword screen. Gemini is optional; mock mode produces reproducible decisions.

## Run locally

```bash
cp .env.example .env
npm install
npm run test
npm run dev
```

Open `http://localhost:8080`.

## Enable Gemini

```bash
export MOCK_AI=false
export GEMINI_API_KEY='your-key'
export GEMINI_MODEL='gemini-2.5-flash'
npm run dev
```

The prototype validates model responses with Zod. For a competition demo, keep mock mode as a fallback in case model access fails.

## Deploy to Cloud Run

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create ai-builder --repository-format=docker --location=asia-southeast1
gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=manual
```

The included Cloud Build deploys with `MOCK_AI=true`. For Gemini, store the key in Secret Manager and configure Cloud Run to expose it as `GEMINI_API_KEY`; do not commit it.

## API

- `GET /api/health`
- `GET /api/samples/borderlens`
- `POST /api/borderlens/analyze`
- `GET /api/samples/comparablescreen`
- `POST /api/comparables/screen`

## Architecture

```text
Browser UI
   -> Express API on Cloud Run
      -> LangGraph StateGraph
         -> deterministic normalization/filtering
         -> deterministic reconciliation
         -> optional Gemini structured explanation
         -> Zod validation
```

## Production extensions

1. Replace manually entered document facts with Document AI OCR/extraction.
2. Add Cloud Storage for files and PostgreSQL/Firestore for workflow records.
3. Add authenticated tenant and engagement scopes.
4. Add page-level evidence references and human approval before exports.
5. Add licensed comparable-company data only after confirming usage rights.
6. Replace keyword screening with evaluated semantic classification plus reviewer override.

## Important limitations

This is a synthetic-data prototype, not tax, legal, customs or transfer-pricing advice. Thresholds are demonstration controls, not statutory rules. Do not place client, employer-confidential, proprietary-database or personal data in a public competition repository.

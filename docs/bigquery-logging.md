# BigQuery logging integration

## 1. Dataset and schema

- Dataset: `christos-playground:news_blog_logging`.
- Table: `edge_logs` with schema in `netlify/logging-schema.json`.
  This schema matches the JSON payload in `netlify/edge-functions/logging.ts`.
- Commands used to seed the schema:

  ```bash
  bq mk --project_id christos-playground \
    --dataset \
    --description "Netlify Edge logging sink" \
    --location=US \
    news_blog_logging
  bq mk --project_id christos-playground \
    --table news_blog_logging.edge_logs \
    netlify/logging-schema.json
  ```

- You can inspect recent logs with
  `bq query --project_id christos-playground \
    'SELECT * FROM news_blog_logging.edge_logs \
    ORDER BY timestamp DESC LIMIT 20'`.

## 2. Service account

- Service account:
  `news-blog-logger@christos-playground.iam.gserviceaccount.com`
  (created with `gcloud iam service-accounts create news-blog-logger`).
- It has `roles/bigquery.dataEditor` on the project
  so the Cloud Run service can insert rows.

  ```bash
  gcloud projects add-iam-policy-binding christos-playground \
    --member \
      serviceAccount: \
        news-blog-logger@christos-playground.iam.gserviceaccount.com \
    --role roles/bigquery.dataEditor
  ```

## 3. Cloud Run ingest endpoint

- Source code lives in `cloud-run/logging-endpoint/`.
- It validates the bearer token and normalizes timestamps
  before writing to BigQuery with `@google-cloud/bigquery`.
- Service URL:
  `https://news-blog-logging-endpoint-135524246046.us-central1.run.app/`.
- Environment variables set on deployment:
  - `BQ_DATASET=news_blog_logging`
  - `BQ_TABLE=edge_logs`
  - `LOGGING_API_KEY=<LOGGING_API_KEY>`
- Deployment command used:

  ```bash
  gcloud run deploy news-blog-logging-endpoint \
    --region us-central1 \
    --source cloud-run/logging-endpoint \
    --allow-unauthenticated \
    --service-account \
      news-blog-logger@christos-playground.iam.gserviceaccount.com \
    --set-env-vars \
      BQ_DATASET=news_blog_logging,\
      BQ_TABLE=edge_logs,\
      LOGGING_API_KEY=<LOGGING_API_KEY> \
    --platform managed
  ```

- For future rotations, redeploy with a new `LOGGING_API_KEY` value.
  Update Netlify with that key.

## 4. Netlify environment variables

Set the following before deploying the site so the edge function can call
the Cloud Run endpoint:

- `LOGGING_ENDPOINT`:
  `https://news-blog-logging-endpoint-135524246046.us-central1.run.app/`
- `LOGGING_API_KEY`: `<LOGGING_API_KEY>`
- `SITE_ENV`: `production` (or `preview`/`development` per deploy context)

The edge function in `netlify/edge-functions/logging.ts` already reads these
variables and ships the JSON payload shown in `README.md`.

## 5. Testing and verification

- You can hit the Cloud Run service directly with the same payload
  the edge function sends:

  ```bash
  API_KEY=<LOGGING_API_KEY>
  ENDPOINT=https://news-blog-logging-endpoint-135524246046.us-central1.run.app/
  curl -X POST "$ENDPOINT" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d @- <<'JSON'
  {
    "request_id": "test",
    "timestamp": "2025-01-10T12:34:56.789Z",
    "method": "GET",
    "path": "/post/js-only",
    "query": "",
    "host": "example.com",
    "user_agent": "curl/8.0",
    "referer": "",
    "x_forwarded_for": "",
    "headers_json": "{}",
    "is_bot": false,
    "bot_family": "unknown",
    "experiment_type": "baseline",
    "render_mode": "ssr",
    "server_delay_ms": 0,
    "response_status": 200,
    "site_env": "production",
    "slug": "js-only"
  }
  JSON
  ```

  After sending a payload, query BigQuery to verify the row arrived
  (see section 1).

## 6. Observability

- Cloud Run logs show insert attempts and failures
  (look for `BigQuery insert failed`).
- You can also inspect `netlify/edge-functions/logging.ts`
  to see exactly which headers/payload fields are sent.

## 7. Next steps

- When rotating the API key, redeploy Cloud Run with the new
  `LOGGING_API_KEY` and copy the same value into Netlify’s
  `LOGGING_API_KEY` for every environment (production, preview, etc.).

const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');

const datasetId = process.env.BQ_DATASET ?? 'news_blog_logging';
const tableId = process.env.BQ_TABLE ?? 'edge_logs';
const expectedApiKey = process.env.LOGGING_API_KEY;
const bigquery = new BigQuery();

const app = express();
app.use(express.json({ limit: '512kb' }));

app.get('/health', (_, res) => res.status(200).send('ok'));

app.post('/', async (req, res) => {
  if (!expectedApiKey) {
    return res.status(500).json({ error: 'LOGGING_API_KEY is not configured' });
  }

  const authHeader = req.headers.authorization ?? '';
  if (authHeader !== `Bearer ${expectedApiKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Expected a JSON object payload' });
  }

  const rows = Array.isArray(payload) ? payload : [payload];
  const normalizedRows = rows.map((row) => {
    const normalized = { ...row };
    if (!normalized.timestamp) {
      normalized.timestamp = new Date().toISOString();
    } else if (typeof normalized.timestamp === 'string') {
      normalized.timestamp = new Date(normalized.timestamp).toISOString();
    }
    return normalized;
  });

  try {
    await bigquery.dataset(datasetId).table(tableId).insert(normalizedRows, { raw: true });
    return res.status(200).json({ inserted: normalizedRows.length });
  } catch (error) {
    console.error('BigQuery insert failed', error);
    if (error?.errors) {
      return res.status(400).json({
        error: 'BigQuery insert partially failed',
        details: error.errors
      });
    }
    return res.status(500).json({ error: 'BigQuery insert failed' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

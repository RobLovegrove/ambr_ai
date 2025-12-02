import express from 'express';
import cors from 'cors';
import { initServer, createExpressEndpoints } from '@ts-rest/express';
import { contract } from './contract';
import { router } from './router';

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

const s = initServer();

// Create ts-rest router
const apiRouter = s.router(contract, router);

// Bind ts-rest router to Express app
// Note: createExpressEndpoints registers routes at the root, so we need to adjust the contract paths
createExpressEndpoints(contract, apiRouter, app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`🚀 API server running on http://localhost:${port}`);
});


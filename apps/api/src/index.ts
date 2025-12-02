import express from 'express';
import cors from 'cors';
import { initServer } from '@ts-rest/express';
import { contract } from './contract';
import { router } from './router';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

const s = initServer();

app.use('/api', s.router(contract, router));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`🚀 API server running on http://localhost:${port}`);
});


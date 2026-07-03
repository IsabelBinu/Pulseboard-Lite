import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth';
import templateRouter from './routes/template';
import uploadsRouter from './routes/uploads';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Public routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes
app.use('/api', requireAuth);
app.use('/api/template', templateRouter);
app.use('/api/uploads', uploadsRouter);

app.get('/api/me', (req, res) => {
  res.json({ message: 'You are authenticated!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
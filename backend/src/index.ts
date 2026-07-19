import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth';
import templateRouter from './routes/template';
import uploadsRouter from './routes/uploads';
import dashboardRouter from './routes/dashboard';
import aiRouter from './routes/ai';            

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', requireAuth);
app.use('/api/template', templateRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ai', aiRouter);                 

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
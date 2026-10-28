import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import sessionRoutes from './routes/sessions.js';
import progressRoutes from './routes/progress.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 20) {
  console.error('Set JWT_SECRET in server/.env to a random string at least 20 characters long.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/progress', progressRoutes);

app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This record already exists.' });
  res.status(500).json({ message: 'Server error. Check the backend terminal for details.' });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`StudySync API running at http://localhost:${port}`));

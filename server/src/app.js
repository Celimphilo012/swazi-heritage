import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.get('/health', (_req, res) => res.json({ status: 'OK', time: new Date().toISOString() }));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

export default app;

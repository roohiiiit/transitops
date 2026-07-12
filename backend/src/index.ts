import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import receiptRoutes from './routes/receipt.route';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads statically
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Register routes
app.use('/receipts', receiptRoutes);

// Root test endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'TransitOps Fuel Receipt Processing API',
    version: '1.0.0',
    status: 'online',
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;

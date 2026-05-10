import 'dotenv/config';
import app from './src/app.js';
import { validateEnv } from './src/config/env.js';
import { testConnection } from './src/config/db.js';
import logger from './src/utils/logger.js';

validateEnv();

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await testConnection();
    app.listen(PORT, () =>
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    );
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

start();

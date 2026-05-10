import logger from '../utils/logger.js';
import { AppError } from '../utils/apiResponse.js';

const normalise = (err) => {
  if (err.code === 'ER_DUP_ENTRY') {
    const match = err.message.match(/for key '(.+)'/);
    const field = match ? match[1].split('.').pop() : 'field';
    return new AppError(`Duplicate value for ${field}.`, 409);
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2')
    return new AppError('Referenced record does not exist.', 404);
  return err;
};

export const notFound = (req, _res, next) =>
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));

export const errorHandler = (err, req, res, _next) => {
  const e = normalise(err);
  const status = e.statusCode || 500;
  if (!e.isOperational)
    logger.error('Unexpected error', { url: req.originalUrl, message: e.message, stack: e.stack });

  const body = { success: false, message: e.message || 'Something went wrong.' };
  if (e.errors) body.errors = e.errors;
  if (process.env.NODE_ENV === 'development') body.stack = e.stack;
  res.status(status).json(body);
};

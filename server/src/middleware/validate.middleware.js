import { validationResult } from 'express-validator';
import { AppError } from '../utils/apiResponse.js';

export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new AppError('Validation failed.', 422, formatted));
  }
  next();
};

export const success  = (res, data = null, message = 'Success', code = 200) =>
  res.status(code).json({ success: true, message, data });

export const created  = (res, data = null, message = 'Created successfully') =>
  success(res, data, message, 201);

export const paginated = (res, data, { total, page, limit }) =>
  res.status(200).json({
    success: true, data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });

export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode   = statusCode;
    this.isOperational = true;
    this.errors       = errors;
  }
}

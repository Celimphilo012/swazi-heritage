import { verifyAccessToken } from '../utils/jwtHelper.js';
import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';

export const protect = async (req, _res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new AppError('No token provided. Please log in.', 401);

    const decoded = verifyAccessToken(auth.split(' ')[1]);
    const users = await query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);

    if (!users.length)            throw new AppError('User no longer exists.', 401);
    if (users[0].status !== 'active') throw new AppError('Account is suspended.', 403);

    req.user = users[0];
    next();
  } catch (err) { next(err); }
};

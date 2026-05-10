import jwt from 'jsonwebtoken';
import { AppError } from './apiResponse.js';

export const signAccessToken   = (p) => jwt.sign(p, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN         || '7d' });
export const signRefreshToken  = (p) => jwt.sign(p, process.env.JWT_REFRESH_SECRET,  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

export const verifyAccessToken  = (t) => { try { return jwt.verify(t, process.env.JWT_SECRET);        } catch { throw new AppError('Invalid or expired access token.',  401); } };
export const verifyRefreshToken = (t) => { try { return jwt.verify(t, process.env.JWT_REFRESH_SECRET); } catch { throw new AppError('Invalid or expired refresh token.', 401); } };

import rateLimit from 'express-rate-limit';

const msg = (m) => ({ success: false, message: m });

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: msg('Too many requests. Please try again later.'),
});

// Gemini free tier is 15 RPM — cap per user at 10 to be safe
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  keyGenerator: (req) => req.user?.id?.toString() || req.ip,
  standardHeaders: true, legacyHeaders: false,
  message: msg('You are asking too quickly. Please wait a moment.'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: msg('Too many login attempts. Please try again later.'),
});

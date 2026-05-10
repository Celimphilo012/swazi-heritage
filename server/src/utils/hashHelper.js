import bcrypt from 'bcryptjs';
export const hashPassword   = (p) => bcrypt.hash(p, 12);
export const comparePassword = (p, h) => bcrypt.compare(p, h);

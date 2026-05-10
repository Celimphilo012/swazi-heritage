import { UserModel } from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/hashHelper.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwtHelper.js';
import { success, created, AppError } from '../utils/apiResponse.js';

const tokens = (user) => ({
  accessToken:  signAccessToken({ id: user.id, role: user.role }),
  refreshToken: signRefreshToken({ id: user.id }),
  user: { id: user.id, name: user.name, email: user.email, role: user.role },
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await UserModel.findByEmail(email)) throw new AppError('Email already registered.', 409);
    const result = await UserModel.create({ name, email, password_hash: await hashPassword(password) });
    created(res, tokens(await UserModel.findById(result.insertId)), 'Account created.');
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);
    if (!user || !(await comparePassword(password, user.password_hash)))
      throw new AppError('Invalid email or password.', 401);
    if (user.status !== 'active') throw new AppError('Account is suspended.', 403);
    success(res, tokens(user), 'Logged in.');
  } catch (err) { next(err); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw new AppError('Refresh token required.', 400);
    const decoded = verifyRefreshToken(token);
    const user = await UserModel.findById(decoded.id);
    if (!user) throw new AppError('User not found.', 401);
    success(res, { accessToken: signAccessToken({ id: user.id, role: user.role }) });
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try { success(res, await UserModel.findById(req.user.id)); } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findByEmail(req.user.email);
    if (!(await comparePassword(currentPassword, user.password_hash)))
      throw new AppError('Current password is incorrect.', 400);
    await UserModel.updatePassword(req.user.id, await hashPassword(newPassword));
    success(res, null, 'Password updated.');
  } catch (err) { next(err); }
};

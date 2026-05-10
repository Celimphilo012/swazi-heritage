import { AppError } from '../utils/apiResponse.js';

export const restrictTo = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role))
    return next(new AppError(`Access denied. Required role: ${roles.join(' or ')}.`, 403));
  next();
};

export const adminOnly           = restrictTo('admin');
export const practitionersOnly   = restrictTo('history_keeper', 'ceremony_keeper');
export const historyKeeperOnly   = restrictTo('history_keeper');
export const ceremonyKeeperOnly  = restrictTo('ceremony_keeper');

import { query } from '../config/db.js';
import logger from '../utils/logger.js';

// Tag a route with an action name: auditLog('APPROVE_CEREMONY')
export const auditLog = (action) => (req, _res, next) => {
  req.auditAction = action;
  next();
};

// Wraps res.json to log after successful admin actions
export const attachAuditLogger = (req, res, next) => {
  const orig = res.json.bind(res);
  res.json = async (body) => {
    if (req.auditAction && res.statusCode < 400 && req.user?.role === 'admin') {
      try {
        await query(
          'INSERT INTO audit_log (admin_id, action, target_type, target_id, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
          [req.user.id, req.auditAction, req.baseUrl.split('/').pop(),
           req.params.id || null, JSON.stringify({ method: req.method, body: req.body }), req.ip]
        );
      } catch (err) { logger.error('Audit log write failed', { error: err.message }); }
    }
    return orig(body);
  };
  next();
};

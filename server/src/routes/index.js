import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly, historyKeeperOnly, ceremonyKeeperOnly } from '../middleware/role.middleware.js';
import { authLimiter, aiLimiter } from '../middleware/rateLimit.middleware.js';
import * as AuthCtrl from '../controllers/auth.controller.js';
import * as CeremonyCtrl from '../controllers/ceremony.controller.js';
import * as PromptCtrl from '../controllers/prompt.controller.js';
import { LineageModel, ClanModel, CinemaModel, BookingModel,
         ImvunuloModel, UserModel, ConfigModel, AuditLogModel } from '../models/models.js';
import { success, created, paginated, AppError } from '../utils/apiResponse.js';

const r = Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
const auth = Router();
auth.post('/register', authLimiter, [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 8 })], validate, AuthCtrl.register);
auth.post('/login',    authLimiter, [body('email').isEmail(), body('password').notEmpty()], validate, AuthCtrl.login);
auth.post('/refresh',  AuthCtrl.refreshToken);
auth.get('/me',    protect, AuthCtrl.getMe);
auth.patch('/password', protect, [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })], validate, AuthCtrl.changePassword);

// ─── Ceremonies ───────────────────────────────────────────────────────────────
const ceremony = Router();
ceremony.get('/',    CeremonyCtrl.getPublishedCeremonies);
ceremony.get('/:id', CeremonyCtrl.getCeremony);
ceremony.use(protect);
ceremony.get('/mine/all', ceremonyKeeperOnly, CeremonyCtrl.getMyCeremonies);
ceremony.get('/admin/all', adminOnly, CeremonyCtrl.getAllCeremonies);
ceremony.post('/', ceremonyKeeperOnly, [body('name').notEmpty(), body('month_celebrated').notEmpty()], validate, CeremonyCtrl.createCeremony);
ceremony.put('/:id', ceremonyKeeperOnly, CeremonyCtrl.updateCeremony);
ceremony.patch('/:id/review', adminOnly, [body('status').isIn(['published', 'rejected'])], validate, CeremonyCtrl.reviewCeremony);
ceremony.post('/:id/songs',       ceremonyKeeperOnly, [body('title').notEmpty()], validate, CeremonyCtrl.addSong);
ceremony.delete('/:id/songs/:songId', ceremonyKeeperOnly, CeremonyCtrl.deleteSong);
ceremony.post('/:id/imvunulo',    ceremonyKeeperOnly, [body('preset_id').isInt()], validate, CeremonyCtrl.addImvunulo);
ceremony.delete('/:id/imvunulo/:imvId', ceremonyKeeperOnly, CeremonyCtrl.deleteImvunulo);

// ─── Lineage ──────────────────────────────────────────────────────────────────
const lineage = Router();
lineage.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows, total } = await LineageModel.getAll({ status: 'published', page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});
lineage.get('/:id', async (req, res, next) => {
  try {
    const rec = await LineageModel.getWithClans(req.params.id);
    if (!rec) throw new AppError('Not found.', 404);
    success(res, rec);
  } catch (err) { next(err); }
});
lineage.use(protect);
lineage.post('/', historyKeeperOnly, [body('title').notEmpty(), body('era').notEmpty()], validate,
  async (req, res, next) => {
    try {
      const result = await LineageModel.create({ ...req.body, created_by: req.user.id });
      created(res, await LineageModel.findById(result.insertId), 'Lineage record submitted for review.');
    } catch (err) { next(err); }
  });
lineage.put('/:id', historyKeeperOnly, async (req, res, next) => {
  try { await LineageModel.update(req.params.id, req.body); success(res, null, 'Updated.'); } catch (err) { next(err); }
});
lineage.patch('/:id/review', adminOnly, [body('status').isIn(['published', 'rejected'])], validate,
  async (req, res, next) => {
    try { await LineageModel.updateStatus(req.params.id, req.body.status, req.user.id); success(res, null, `Lineage record ${req.body.status}.`); } catch (err) { next(err); }
  });
lineage.get('/admin/all', adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { rows, total } = await LineageModel.getAll({ status, page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});

// ─── Clans ────────────────────────────────────────────────────────────────────
const clan = Router();
clan.use(protect, historyKeeperOnly);
clan.post('/',    [body('name').notEmpty(), body('lineage_id').isInt()], validate, async (req, res, next) => {
  try { const r = await ClanModel.create(req.body); created(res, { id: r.insertId, ...req.body }); } catch (err) { next(err); }
});
clan.put('/:id',  async (req, res, next) => { try { await ClanModel.update(req.params.id, req.body); success(res, null, 'Clan updated.'); } catch (err) { next(err); } });
clan.delete('/:id', async (req, res, next) => { try { await ClanModel.delete(req.params.id); success(res, null, 'Clan deleted.'); } catch (err) { next(err); } });

// ─── Cinema ───────────────────────────────────────────────────────────────────
const cinema = Router();
cinema.get('/', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const { rows, total } = await CinemaModel.getAll({ type, status: 'scheduled', page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});
cinema.get('/:id', async (req, res, next) => {
  try {
    const c = await CinemaModel.findById(req.params.id);
    if (!c) throw new AppError('Session not found.', 404);
    success(res, c);
  } catch (err) { next(err); }
});
cinema.use(protect);
cinema.post('/book/:id', async (req, res, next) => {
  try {
    if (await BookingModel.exists(req.user.id, req.params.id))
      throw new AppError('Already booked.', 409);
    await BookingModel.create({ user_id: req.user.id, cinema_id: req.params.id });
    success(res, null, 'Booking confirmed.', 201);
  } catch (err) { next(err); }
});
cinema.get('/my/bookings', async (req, res, next) => {
  try { success(res, await BookingModel.findByUser(req.user.id)); } catch (err) { next(err); }
});
cinema.post('/', adminOnly, [body('title').notEmpty(), body('type').isIn(['live', 'recorded']), body('stream_url').isURL()], validate,
  async (req, res, next) => {
    try { const r = await CinemaModel.create({ ...req.body, created_by: req.user.id }); created(res, { id: r.insertId, ...req.body }); } catch (err) { next(err); }
  });
cinema.put('/:id', adminOnly, async (req, res, next) => {
  try { await CinemaModel.update(req.params.id, req.body); success(res, null, 'Updated.'); } catch (err) { next(err); }
});
cinema.get('/:id/bookings', adminOnly, async (req, res, next) => {
  try { success(res, await BookingModel.findByCinema(req.params.id)); } catch (err) { next(err); }
});

// ─── AI Prompts ───────────────────────────────────────────────────────────────
const prompts = Router();
prompts.use(protect);
prompts.post('/ask', aiLimiter, [body('question').notEmpty().isLength({ max: 1000 })], validate, PromptCtrl.askQuestion);
prompts.get('/history', PromptCtrl.getMyHistory);
prompts.get('/admin/all', adminOnly, PromptCtrl.getAllPrompts);

// ─── Admin ────────────────────────────────────────────────────────────────────
const admin = Router();
admin.use(protect, adminOnly);
admin.get('/users', async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const { rows, total } = await UserModel.getAll({ role, status, search, page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});
admin.patch('/users/:id/status', [body('status').isIn(['active', 'suspended'])], validate,
  async (req, res, next) => { try { await UserModel.updateStatus(req.params.id, req.body.status); success(res, null, `User ${req.body.status}.`); } catch (err) { next(err); } });
admin.patch('/users/:id/role',   [body('role').isIn(['user', 'history_keeper', 'ceremony_keeper', 'admin'])], validate,
  async (req, res, next) => { try { await UserModel.updateRole(req.params.id, req.body.role); success(res, null, 'Role updated.'); } catch (err) { next(err); } });
admin.get('/imvunulo-presets', async (_req, res, next) => { try { success(res, await ImvunuloModel.getPresets()); } catch (err) { next(err); } });
admin.post('/imvunulo-presets', [body('name').notEmpty()], validate,
  async (req, res, next) => { try { const r = await ImvunuloModel.createPreset(req.body); created(res, { id: r.insertId, ...req.body }); } catch (err) { next(err); } });
admin.put('/imvunulo-presets/:id',
  async (req, res, next) => { try { await ImvunuloModel.updatePreset(req.params.id, req.body); success(res, null, 'Preset updated.'); } catch (err) { next(err); } });
admin.get('/config', async (_req, res, next) => { try { success(res, await ConfigModel.getAll()); } catch (err) { next(err); } });
admin.put('/config/:key', [body('value').notEmpty()], validate,
  async (req, res, next) => { try { await ConfigModel.upsert(req.params.key, req.body.value); success(res, null, 'Config updated.'); } catch (err) { next(err); } });
admin.get('/analytics/summary', async (_req, res, next) => {
  try {
    const { query } = await import('../config/db.js');
    const [userCounts, contentCounts, promptStats, recentBookings] = await Promise.all([
      UserModel.countByRole(),
      query("SELECT status, COUNT(*) AS count FROM ceremonies GROUP BY status"),
      query("SELECT source, COUNT(*) AS count FROM ai_prompts GROUP BY source"),
      query("SELECT DATE(booked_at) AS date, COUNT(*) AS count FROM bookings GROUP BY DATE(booked_at) ORDER BY date DESC LIMIT 30"),
    ]);
    success(res, { userCounts, contentCounts, promptStats, recentBookings });
  } catch (err) { next(err); }
});
admin.get('/audit-log', async (req, res, next) => {
  try { success(res, await AuditLogModel.getAll({ page: +req.query.page || 1, limit: +req.query.limit || 50 })); } catch (err) { next(err); }
});

// ─── Mount all ────────────────────────────────────────────────────────────────
r.use('/auth',      auth);
r.use('/ceremonies', ceremony);
r.use('/lineage',   lineage);
r.use('/clans',     clan);
r.use('/cinema',    cinema);
r.use('/prompts',   prompts);
r.use('/admin',     admin);

export default r;

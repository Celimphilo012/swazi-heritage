import { CeremonyModel } from '../models/ceremony.model.js';
import { SongModel, ImvunuloModel } from '../models/models.js';
import { success, created, paginated, AppError } from '../utils/apiResponse.js';

export const createCeremony = async (req, res, next) => {
  try {
    const result = await CeremonyModel.create({ ...req.body, created_by: req.user.id });
    created(res, await CeremonyModel.findById(result.insertId), 'Ceremony submitted for review.');
  } catch (err) { next(err); }
};

export const updateCeremony = async (req, res, next) => {
  try {
    const c = await CeremonyModel.findById(req.params.id);
    if (!c) throw new AppError('Ceremony not found.', 404);
    if (c.created_by !== req.user.id && req.user.role !== 'admin')
      throw new AppError('You can only edit your own ceremonies.', 403);
    if (c.status === 'published')
      await CeremonyModel.updateStatus(req.params.id, 'pending_review', null);
    await CeremonyModel.update(req.params.id, req.body);
    success(res, await CeremonyModel.getFullDetail(req.params.id), 'Ceremony updated and re-submitted for review.');
  } catch (err) { next(err); }
};

export const getCeremony = async (req, res, next) => {
  try {
    const c = await CeremonyModel.getFullDetail(req.params.id);
    if (!c) throw new AppError('Ceremony not found.', 404);
    success(res, c);
  } catch (err) { next(err); }
};

export const getMyCeremonies = async (req, res, next) => {
  try { success(res, await CeremonyModel.findByCreator(req.user.id, req.query.status)); } catch (err) { next(err); }
};

export const getPublishedCeremonies = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows, total } = await CeremonyModel.getAll({ status: 'published', page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

export const getAllCeremonies = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { rows, total } = await CeremonyModel.getAll({ status, page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

export const reviewCeremony = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['published', 'rejected'].includes(status)) throw new AppError('Invalid status.', 400);
    await CeremonyModel.updateStatus(req.params.id, status, req.user.id);
    success(res, null, `Ceremony ${status}.`);
  } catch (err) { next(err); }
};

export const addSong = async (req, res, next) => {
  try {
    const r = await SongModel.create({ ...req.body, ceremony_id: req.params.id });
    success(res, { id: r.insertId, ...req.body }, 'Song added.', 201);
  } catch (err) { next(err); }
};

export const deleteSong = async (req, res, next) => {
  try { await SongModel.delete(req.params.songId); success(res, null, 'Song removed.'); } catch (err) { next(err); }
};

export const addImvunulo = async (req, res, next) => {
  try {
    const r = await ImvunuloModel.addToCeremony({ ...req.body, ceremony_id: req.params.id });
    success(res, { id: r.insertId }, 'Imvunulo added.', 201);
  } catch (err) { next(err); }
};

export const deleteImvunulo = async (req, res, next) => {
  try { await ImvunuloModel.delete(req.params.imvId); success(res, null, 'Imvunulo removed.'); } catch (err) { next(err); }
};

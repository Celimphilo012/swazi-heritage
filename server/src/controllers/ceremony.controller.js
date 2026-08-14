import { CeremonyModel } from '../models/ceremony.model.js';
import { SongModel, ImvunuloModel, UserModel } from '../models/models.js';
import { success, created, paginated, AppError } from '../utils/apiResponse.js';
import { autoTranslateCeremony } from '../utils/translate.js';
import { sendMail } from '../utils/mailer.js';
import { pendingReviewEmail, contentReviewedEmail } from '../utils/emailTemplates.js';

export const createCeremony = async (req, res, next) => {
  try {
    const body = await autoTranslateCeremony(req.body);
    const result = await CeremonyModel.create({ ...body, created_by: req.user.id });
    const ceremony = await CeremonyModel.findById(result.insertId);
    created(res, ceremony, 'Ceremony submitted for review.');
    // Notify admins (fire-and-forget)
    UserModel.getAdmins().then(admins => {
      admins.forEach(admin => {
        const { subject, html } = pendingReviewEmail({
          contentType: 'Ceremony', title: ceremony.name,
          practitionerName: req.user.name, adminName: admin.name,
        });
        sendMail({ to: admin.notification_email || admin.email, subject, html });
      });
    }).catch(() => {});
  } catch (err) { next(err); }
};

export const updateCeremony = async (req, res, next) => {
  try {
    const c = await CeremonyModel.findById(req.params.id);
    if (!c) throw new AppError('Ceremony not found.', 404);
    if (c.created_by !== req.user.id && req.user.role !== 'admin')
      throw new AppError('You can only edit your own ceremonies.', 403);
    const resubmitted = c.status === 'published' || c.status === 'rejected';
    if (resubmitted)
      await CeremonyModel.updateStatus(req.params.id, 'pending_review', null);
    const body = await autoTranslateCeremony(req.body);
    await CeremonyModel.update(req.params.id, body);
    success(res, await CeremonyModel.getFullDetail(req.params.id), 'Ceremony updated and re-submitted for review.');
    // Notify admins (fire-and-forget)
    if (resubmitted) {
      UserModel.getAdmins().then(admins => {
        admins.forEach(admin => {
          const { subject, html } = pendingReviewEmail({
            contentType: 'Ceremony', title: c.name,
            practitionerName: req.user.name, adminName: admin.name,
          });
          sendMail({ to: admin.notification_email || admin.email, subject, html });
        });
      }).catch(() => {});
    }
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
    const { page = 1, limit = 20, month, search } = req.query;
    const { rows, total } = await CeremonyModel.getAll({ status: 'published', month, search, page: +page, limit: +limit });
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
    const { status, rejection_note } = req.body;
    if (!['published', 'rejected', 'pending_review'].includes(status)) throw new AppError('Invalid status.', 400);
    const ceremony = await CeremonyModel.findById(req.params.id);
    await CeremonyModel.updateStatus(req.params.id, status, req.user.id, rejection_note);
    success(res, null, `Ceremony ${status}.`);
    // Notify practitioner (fire-and-forget)
    if (ceremony && (status === 'published' || status === 'rejected')) {
      UserModel.findById(ceremony.created_by).then(practitioner => {
        if (!practitioner?.email) return;
        const { subject, html } = contentReviewedEmail({
          contentType: 'Ceremony', title: ceremony.name,
          status, rejectionNote: rejection_note,
          practitionerName: practitioner.name,
        });
        sendMail({ to: practitioner.notification_email || practitioner.email, subject, html });
      }).catch(() => {});
    }
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

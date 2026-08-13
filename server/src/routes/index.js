import { Router } from "express";
import { query } from "../config/db.js";
import { body } from "express-validator";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { validate } from "../middleware/validate.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import { trainModel, getModelInfo } from "../ml/trainer.js";
import { predictAnswer, clearPredictorCache, getRelevantDocs } from "../ml/predictor.js";
import { isOllamaAvailable, listOllamaModels, generateWithOllama, buildRagPrompt } from "../config/ollama.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadStorage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpe?g|png|gif|webp|mp3|wav|ogg|m4a|aac|pdf)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});
import {
  adminOnly,
  practitionersOnly,
  ceremonyKeeperOnly,
  historyKeeperOnly,
} from "../middleware/role.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";
import { attachAuditLogger, auditLog } from "../middleware/audit.middleware.js";

// Controllers
import * as AuthCtrl from "../controllers/auth.controller.js";
import * as CeremonyCtrl from "../controllers/ceremony.controller.js";
import * as PromptCtrl from "../controllers/prompt.controller.js";
import { hashPassword } from "../utils/hashHelper.js";

// Inline controllers for models that don't need a full controller file
import {
  LineageModel,
  ClanModel,
  CinemaModel,
  BookingModel,
  SeminarModel,
  SeminarBookingModel,
  NotificationModel,
  ImvunuloModel,
  UserModel,
  ConfigModel,
  AuditLogModel,
  PreferencesModel,
  ServicesModel,
  ImvunuloListingModel,
  TourismModel,
  PublicationsModel,
  RatingsModel,
  StepsModel,
} from "../models/models.js";
import { success, created, paginated, AppError } from "../utils/apiResponse.js";
import { autoTranslateLineage } from "../utils/translate.js";
import { sendMail } from "../utils/mailer.js";
import {
  pendingReviewEmail,
  contentReviewedEmail,
  newEnquiryEmail,
  imvunuloListingEnquiryEmail,
  seminarBookingConfirmedEmail,
  seminarUpdatedEmail,
  seminarCancelledEmail,
  newSeminarBookingEmail,
} from "../utils/emailTemplates.js";

// Fire-and-forget in-app notification helper — errors never bubble to the caller.
const notify = ({ user_id, type, title, body, link }) =>
  NotificationModel.create({ user_id, type, title, body, link }).catch(() => {});
const notifyMany = (rows) => NotificationModel.createMany(rows).catch(() => {});

const router = Router();
router.use(attachAuditLogger);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const authRouter = Router();
authRouter.post(
  "/register",
  authLimiter,
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
  ],
  validate,
  AuthCtrl.register,
);
authRouter.post(
  "/login",
  authLimiter,
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  AuthCtrl.login,
);
authRouter.post("/refresh", AuthCtrl.refreshToken);
authRouter.get("/me", protect, AuthCtrl.getMe);
authRouter.patch(
  "/password",
  protect,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ],
  validate,
  AuthCtrl.changePassword,
);
authRouter.patch(
  "/profile",
  protect,
  [body("name").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { name, bio, avatar_url, notification_email } = req.body;
      await UserModel.updateProfile(req.user.id, { name, bio, avatar_url, notification_email });
      success(res, await UserModel.findById(req.user.id), "Profile updated.");
    } catch (err) {
      next(err);
    }
  },
);

// Preferences
authRouter.get("/preferences", protect, async (req, res, next) => {
  try {
    const prefs = await PreferencesModel.findByUser(req.user.id);
    success(res, prefs || { interests: [], visitor_type: 'local', preferred_lang: 'en' });
  } catch (err) { next(err); }
});
authRouter.put(
  "/preferences",
  protect,
  [
    body("visitor_type").optional().isIn(["local", "tourist", "researcher", "student", "other"]),
    body("imvunulo_budget_max").optional({ nullable: true }).isFloat({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { interests, visitor_type, preferred_lang, imvunulo_budget_max } = req.body;
      await PreferencesModel.upsert(req.user.id, { interests, visitor_type, preferred_lang, imvunulo_budget_max });
      success(res, await PreferencesModel.findByUser(req.user.id), "Preferences saved.");
    } catch (err) { next(err); }
  },
);

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
router.post(
  "/upload",
  protect,
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    success(res, { url: `/uploads/${req.file.filename}` });
  },
);

// ─── CEREMONIES ───────────────────────────────────────────────────────────────
const ceremonyRouter = Router();
ceremonyRouter.get("/", CeremonyCtrl.getPublishedCeremonies);

// Resources needed by the ceremony form — must be BEFORE /:id to avoid clash
ceremonyRouter.get(
  "/resources/presets",
  protect,
  ceremonyKeeperOnly,
  async (_req, res, next) => {
    try {
      success(res, await ImvunuloModel.getPresets());
    } catch (err) {
      next(err);
    }
  },
);
ceremonyRouter.post(
  "/resources/presets",
  protect,
  ceremonyKeeperOnly,
  [body("name").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, gender = "both", image_url } = req.body;
      const result = await ImvunuloModel.createPreset({ name, description, gender, image_url });
      const preset = { id: result.insertId, name, description, gender, image_url: image_url || null, active: 1 };
      created(res, preset, "Attire preset created.");
    } catch (err) {
      next(err);
    }
  },
);
ceremonyRouter.get("/resources/months", protect, async (_req, res, next) => {
  try {
    const raw = await ConfigModel.get("ceremony_months");
    const months = raw
      ? JSON.parse(raw)
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
          "Incwala season (December–January)",
          "Umhlanga season (August–September)",
        ];
    success(res, months);
  } catch (err) {
    next(err);
  }
});

ceremonyRouter.get("/:id", CeremonyCtrl.getCeremony);
ceremonyRouter.get("/:id/ratings", async (req, res, next) => {
  try {
    const [reviews, summary] = await Promise.all([
      RatingsModel.findByContent('ceremony', req.params.id),
      RatingsModel.getSummary('ceremony', req.params.id),
    ]);
    success(res, { reviews, summary });
  } catch (err) { next(err); }
});
ceremonyRouter.use(protect);
ceremonyRouter.get(
  "/mine/all",
  ceremonyKeeperOnly,
  CeremonyCtrl.getMyCeremonies,
);
ceremonyRouter.post(
  "/",
  ceremonyKeeperOnly,
  [body("name").notEmpty(), body("month_celebrated").notEmpty()],
  validate,
  CeremonyCtrl.createCeremony,
);
ceremonyRouter.put("/:id", ceremonyKeeperOnly, CeremonyCtrl.updateCeremony);
// Songs
ceremonyRouter.post(
  "/:id/songs",
  ceremonyKeeperOnly,
  [body("title").notEmpty()],
  validate,
  CeremonyCtrl.addSong,
);
ceremonyRouter.delete(
  "/:id/songs/:songId",
  ceremonyKeeperOnly,
  CeremonyCtrl.deleteSong,
);
// Imvunulo
ceremonyRouter.post(
  "/:id/imvunulo",
  ceremonyKeeperOnly,
  [body("preset_id").isInt()],
  validate,
  CeremonyCtrl.addImvunulo,
);
ceremonyRouter.delete(
  "/:id/imvunulo/:imvunuloId",
  ceremonyKeeperOnly,
  CeremonyCtrl.deleteImvunulo,
);
// Admin review
ceremonyRouter.patch(
  "/:id/review",
  adminOnly,
  auditLog("review_ceremony"),
  [body("status").isIn(["published", "rejected", "pending_review"])],
  validate,
  CeremonyCtrl.reviewCeremony,
);
ceremonyRouter.get("/admin/all", adminOnly, CeremonyCtrl.getAllCeremonies);

// Ratings (submit — authenticated user)
ceremonyRouter.post(
  "/:id/ratings",
  [body("score").isInt({ min: 1, max: 5 })],
  validate,
  async (req, res, next) => {
    try {
      const { score, comment } = req.body;
      await RatingsModel.upsert({ user_id: req.user.id, content_type: 'ceremony', content_id: req.params.id, score, comment });
      const summary = await RatingsModel.getSummary('ceremony', req.params.id);
      success(res, summary, "Rating saved.");
    } catch (err) { next(err); }
  },
);

// Walkthrough steps
ceremonyRouter.get("/:id/steps", async (req, res, next) => {
  try { success(res, await StepsModel.findByCeremony(req.params.id)); } catch (err) { next(err); }
});
ceremonyRouter.post(
  "/:id/steps",
  ceremonyKeeperOnly,
  [body("title").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, media_url } = req.body;
      const step_number = await StepsModel.getNextStepNumber(req.params.id);
      const result = await StepsModel.create({ ceremony_id: req.params.id, step_number, title, description, media_url });
      created(res, { id: result.insertId, step_number, title, description, media_url }, "Step added.");
    } catch (err) { next(err); }
  },
);
ceremonyRouter.put("/:id/steps/:stepId", ceremonyKeeperOnly, async (req, res, next) => {
  try {
    await StepsModel.update(req.params.stepId, req.body);
    success(res, null, "Step updated.");
  } catch (err) { next(err); }
});
ceremonyRouter.delete("/:id/steps/:stepId", ceremonyKeeperOnly, async (req, res, next) => {
  try {
    await StepsModel.delete(req.params.stepId);
    success(res, null, "Step deleted.");
  } catch (err) { next(err); }
});

// ─── LINEAGE ──────────────────────────────────────────────────────────────────
const lineageRouter = Router();
lineageRouter.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows, total } = await LineageModel.getAll({
      status: "published",
      page: Number(page),
      limit: Number(limit),
    });
    paginated(res, rows, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});
lineageRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await LineageModel.getWithClans(req.params.id);
    if (!record) throw new AppError("Not found.", 404);
    success(res, record);
  } catch (err) {
    next(err);
  }
});
lineageRouter.get("/:id/ratings", async (req, res, next) => {
  try {
    const [reviews, summary] = await Promise.all([
      RatingsModel.findByContent('lineage', req.params.id),
      RatingsModel.getSummary('lineage', req.params.id),
    ]);
    success(res, { reviews, summary });
  } catch (err) { next(err); }
});
lineageRouter.use(protect);
lineageRouter.post(
  "/:id/ratings",
  [body("score").isInt({ min: 1, max: 5 })],
  validate,
  async (req, res, next) => {
    try {
      const { score, comment } = req.body;
      await RatingsModel.upsert({ user_id: req.user.id, content_type: 'lineage', content_id: req.params.id, score, comment });
      const summary = await RatingsModel.getSummary('lineage', req.params.id);
      success(res, summary, "Rating saved.");
    } catch (err) { next(err); }
  },
);
lineageRouter.get("/mine/all", historyKeeperOnly, async (req, res, next) => {
  try {
    const records = await LineageModel.findByCreator(req.user.id, req.query.status);
    success(res, records);
  } catch (err) {
    next(err);
  }
});
lineageRouter.get("/admin/all", adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { rows, total } = await LineageModel.getAll({
      status,
      page: Number(page),
      limit: Number(limit),
    });
    paginated(res, rows, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});
lineageRouter.post(
  "/",
  historyKeeperOnly,
  [body("title").notEmpty(), body("era").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const body = await autoTranslateLineage(req.body);
      const result = await LineageModel.create({ ...body, created_by: req.user.id });
      const record = await LineageModel.findById(result.insertId);
      created(res, record, "Lineage record submitted for review.");
      // Notify admins (fire-and-forget)
      UserModel.getAdmins().then(admins => {
        admins.forEach(admin => {
          const { subject, html } = pendingReviewEmail({
            contentType: 'Lineage Record', title: record.title,
            practitionerName: req.user.name, adminName: admin.name,
          });
          sendMail({ to: admin.notification_email || admin.email, subject, html });
        });
      }).catch(() => {});
    } catch (err) {
      next(err);
    }
  },
);
lineageRouter.put("/:id", historyKeeperOnly, async (req, res, next) => {
  try {
    const record = await LineageModel.findById(req.params.id);
    if (!record) throw new AppError("Lineage record not found.", 404);
    if (record.created_by !== req.user.id) throw new AppError("You can only edit your own records.", 403);
    if (record.status === "published" || record.status === "rejected")
      await LineageModel.updateStatus(req.params.id, "pending_review", null, null);
    const body = await autoTranslateLineage(req.body);
    await LineageModel.update(req.params.id, body);
    success(res, null, "Lineage record updated and resubmitted for review.");
  } catch (err) {
    next(err);
  }
});
lineageRouter.patch(
  "/:id/review",
  adminOnly,
  auditLog("review_lineage"),
  [body("status").isIn(["published", "rejected", "pending_review"])],
  validate,
  async (req, res, next) => {
    try {
      const record = await LineageModel.findById(req.params.id);
      await LineageModel.updateStatus(
        req.params.id,
        req.body.status,
        req.user.id,
        req.body.rejection_note,
      );
      success(res, null, `Lineage record ${req.body.status}.`);
      // Notify practitioner (fire-and-forget)
      if (record && (req.body.status === 'published' || req.body.status === 'rejected')) {
        UserModel.findById(record.created_by).then(practitioner => {
          if (!practitioner?.email) return;
          const { subject, html } = contentReviewedEmail({
            contentType: 'Lineage Record', title: record.title,
            status: req.body.status, rejectionNote: req.body.rejection_note,
            practitionerName: practitioner.name,
          });
          sendMail({ to: practitioner.notification_email || practitioner.email, subject, html });
        }).catch(() => {});
      }
    } catch (err) {
      next(err);
    }
  },
);

// ─── CLANS ────────────────────────────────────────────────────────────────────
const clanRouter = Router();
clanRouter.use(protect, historyKeeperOnly);
clanRouter.post(
  "/",
  [body("name").notEmpty(), body("lineage_id").isInt()],
  validate,
  async (req, res, next) => {
    try {
      const result = await ClanModel.create(req.body);
      created(res, { id: result.insertId, ...req.body });
    } catch (err) {
      next(err);
    }
  },
);
clanRouter.put("/:id", async (req, res, next) => {
  try {
    await ClanModel.update(req.params.id, req.body);
    success(res, null, "Clan updated.");
  } catch (err) {
    next(err);
  }
});
clanRouter.delete("/:id", async (req, res, next) => {
  try {
    await ClanModel.delete(req.params.id);
    success(res, null, "Clan deleted.");
  } catch (err) {
    next(err);
  }
});

// ─── CINEMA ───────────────────────────────────────────────────────────────────
const cinemaRouter = Router();
cinemaRouter.get("/", async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const { rows, total } = await CinemaModel.getAll({
      type,
      statuses: ["scheduled", "live", "available"],
      page: Number(page),
      limit: Number(limit),
    });
    paginated(res, rows, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});
cinemaRouter.get("/:id", async (req, res, next) => {
  try {
    const cinema = await CinemaModel.findById(req.params.id);
    if (!cinema) throw new AppError("Cinema session not found.", 404);
    success(res, cinema);
  } catch (err) {
    next(err);
  }
});
cinemaRouter.use(protect);
cinemaRouter.patch("/bookings/:id/cancel", async (req, res, next) => {
  try {
    await BookingModel.updateStatus(req.params.id, "cancelled");
    success(res, null, "Booking cancelled.");
  } catch (err) {
    next(err);
  }
});
cinemaRouter.post("/book/:id", async (req, res, next) => {
  try {
    const exists = await BookingModel.exists(req.user.id, req.params.id);
    if (exists)
      throw new AppError("You already have a booking for this session.", 409);
    await BookingModel.create({
      user_id: req.user.id,
      cinema_id: req.params.id,
    });
    success(res, null, "Booking confirmed.", 201);
  } catch (err) {
    next(err);
  }
});
cinemaRouter.get("/my/bookings", async (req, res, next) => {
  try {
    const bookings = await BookingModel.findByUser(req.user.id);
    success(res, bookings);
  } catch (err) {
    next(err);
  }
});
// Admin
cinemaRouter.post(
  "/",
  adminOnly,
  auditLog("create_cinema"),
  [
    body("title").notEmpty(),
    body("type").isIn(["live", "recorded"]),
    body("stream_url").isURL(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const status = req.body.type === "recorded" ? "available" : (req.body.status || "scheduled");
      const result = await CinemaModel.create({
        ...req.body,
        status,
        created_by: req.user.id,
      });
      created(res, { id: result.insertId, ...req.body, status });
    } catch (err) {
      next(err);
    }
  },
);
cinemaRouter.put("/:id", adminOnly, auditLog("update_cinema"), async (req, res, next) => {
  try {
    await CinemaModel.update(req.params.id, req.body);
    success(res, null, "Session updated.");
  } catch (err) {
    next(err);
  }
});
cinemaRouter.get("/:id/bookings", adminOnly, async (req, res, next) => {
  try {
    const bookings = await BookingModel.findByCinema(req.params.id);
    success(res, bookings);
  } catch (err) {
    next(err);
  }
});

// ─── SEMINARS / WORKSHOPS ─────────────────────────────────────────────────────
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const assertSeminarOwner = (seminar, req) => {
  if (!seminar) throw new AppError("Seminar not found.", 404);
  if (seminar.practitioner_id !== req.user.id && req.user.role !== "admin")
    throw new AppError("You can only manage your own seminars.", 403);
};

const seminarRouter = Router();
seminarRouter.get("/", async (req, res, next) => {
  try {
    const { format, page = 1, limit = 20 } = req.query;
    const { rows, total } = await SeminarModel.getAll({
      format,
      statuses: ["scheduled", "ongoing"],
      page: Number(page),
      limit: Number(limit),
    });
    paginated(res, rows, { total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});
seminarRouter.get("/:id", async (req, res, next) => {
  try {
    const seminar = await SeminarModel.findById(req.params.id);
    if (!seminar) throw new AppError("Seminar not found.", 404);
    success(res, seminar);
  } catch (err) { next(err); }
});
seminarRouter.use(protect);
seminarRouter.get("/mine/all", practitionersOnly, async (req, res, next) => {
  try { success(res, await SeminarModel.findByPractitioner(req.user.id)); }
  catch (err) { next(err); }
});
seminarRouter.get("/my/bookings", async (req, res, next) => {
  try { success(res, await SeminarBookingModel.findByUser(req.user.id)); }
  catch (err) { next(err); }
});
seminarRouter.post(
  "/",
  practitionersOnly,
  [
    body("title").notEmpty(),
    body("format").isIn(["online", "physical"]),
    body("scheduled_at").notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await SeminarModel.create({ ...req.body, practitioner_id: req.user.id });
      created(res, { id: result.insertId, ...req.body });
    } catch (err) { next(err); }
  },
);
seminarRouter.put("/:id", practitionersOnly, async (req, res, next) => {
  try {
    const seminar = await SeminarModel.findById(req.params.id);
    assertSeminarOwner(seminar, req);

    const scheduleChanged =
      req.body.scheduled_at && new Date(req.body.scheduled_at).getTime() !== new Date(seminar.scheduled_at).getTime();
    await SeminarModel.update(req.params.id, req.body);
    success(res, null, "Seminar updated.");

    if (scheduleChanged) {
      const updated = { ...seminar, ...req.body };
      SeminarBookingModel.findBySeminar(req.params.id).then((bookings) => {
        const confirmed = bookings.filter((b) => b.status === "confirmed");
        notifyMany(confirmed.map((b) => ({
          user_id: b.user_id,
          type: "seminar_updated",
          title: `Schedule changed: "${updated.title}"`,
          body: `New time: ${fmtDateTime(updated.scheduled_at)}`,
          link: `/seminars/${updated.id}`,
        })));
        confirmed.forEach((b) => {
          const { subject, html } = seminarUpdatedEmail({
            title: updated.title,
            scheduledAt: fmtDateTime(updated.scheduled_at),
            format: updated.format,
            locationName: updated.location_name,
            meetingUrl: updated.meeting_url,
            userName: b.name,
          });
          sendMail({ to: b.notification_email || b.email, subject, html });
        });
      }).catch(() => {});
    }
  } catch (err) { next(err); }
});
seminarRouter.patch("/:id/cancel", practitionersOnly, async (req, res, next) => {
  try {
    const seminar = await SeminarModel.findById(req.params.id);
    assertSeminarOwner(seminar, req);
    await SeminarModel.update(req.params.id, { status: "cancelled" });
    success(res, null, "Seminar cancelled.");

    SeminarBookingModel.findBySeminar(req.params.id).then((bookings) => {
      const confirmed = bookings.filter((b) => b.status === "confirmed");
      notifyMany(confirmed.map((b) => ({
        user_id: b.user_id,
        type: "seminar_cancelled",
        title: `Cancelled: "${seminar.title}"`,
        link: `/bookings`,
      })));
      confirmed.forEach((b) => {
        const { subject, html } = seminarCancelledEmail({ title: seminar.title, userName: b.name });
        sendMail({ to: b.notification_email || b.email, subject, html });
      });
    }).catch(() => {});
  } catch (err) { next(err); }
});
seminarRouter.get("/:id/bookings", practitionersOnly, async (req, res, next) => {
  try {
    const seminar = await SeminarModel.findById(req.params.id);
    assertSeminarOwner(seminar, req);
    success(res, await SeminarBookingModel.findBySeminar(req.params.id));
  } catch (err) { next(err); }
});
seminarRouter.post("/:id/book", async (req, res, next) => {
  try {
    const seminar = await SeminarModel.findById(req.params.id);
    if (!seminar) throw new AppError("Seminar not found.", 404);
    const exists = await SeminarBookingModel.exists(req.user.id, req.params.id);
    if (exists) throw new AppError("You already have a booking for this seminar.", 409);
    if (seminar.capacity) {
      const confirmedCount = await SeminarBookingModel.countConfirmed(req.params.id);
      if (confirmedCount >= seminar.capacity) throw new AppError("This seminar is fully booked.", 409);
    }
    await SeminarBookingModel.create({ user_id: req.user.id, seminar_id: req.params.id });
    success(res, null, "Booking confirmed.", 201);

    notify({
      user_id: seminar.practitioner_id,
      type: "seminar_booking",
      title: `New booking: "${seminar.title}"`,
      body: `${req.user.name} booked a spot.`,
      link: `/practitioner/seminars`,
    });
    UserModel.findById(seminar.practitioner_id).then((practitioner) => {
      if (practitioner?.email) {
        const { subject, html } = newSeminarBookingEmail({
          title: seminar.title,
          userName: req.user.name,
          scheduledAt: fmtDateTime(seminar.scheduled_at),
          practitionerName: practitioner.name,
        });
        sendMail({ to: practitioner.notification_email || practitioner.email, subject, html });
      }
    }).catch(() => {});
    const { subject, html } = seminarBookingConfirmedEmail({
      title: seminar.title,
      scheduledAt: fmtDateTime(seminar.scheduled_at),
      format: seminar.format,
      locationName: seminar.location_name,
      meetingUrl: seminar.meeting_url,
      userName: req.user.name,
    });
    sendMail({ to: req.user.notification_email || req.user.email, subject, html });
  } catch (err) { next(err); }
});
seminarRouter.patch("/bookings/:id/cancel", async (req, res, next) => {
  try {
    const booking = await SeminarBookingModel.findById(req.params.id);
    if (!booking) throw new AppError("Booking not found.", 404);
    if (booking.user_id !== req.user.id) throw new AppError("You can only cancel your own bookings.", 403);
    await SeminarBookingModel.updateStatus(req.params.id, "cancelled");
    success(res, null, "Booking cancelled.");
  } catch (err) { next(err); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
const notificationsRouter = Router();
notificationsRouter.use(protect);
notificationsRouter.get("/", async (req, res, next) => {
  try { success(res, await NotificationModel.findByUser(req.user.id)); }
  catch (err) { next(err); }
});
notificationsRouter.get("/unread-count", async (req, res, next) => {
  try { success(res, { count: await NotificationModel.countUnread(req.user.id) }); }
  catch (err) { next(err); }
});
notificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    await NotificationModel.markRead(req.params.id, req.user.id);
    success(res, null, "Marked as read.");
  } catch (err) { next(err); }
});
notificationsRouter.patch("/read-all", async (req, res, next) => {
  try {
    await NotificationModel.markAllRead(req.user.id);
    success(res, null, "All marked as read.");
  } catch (err) { next(err); }
});

// ─── AI PROMPTS ───────────────────────────────────────────────────────────────
const promptRouter = Router();
promptRouter.use(protect);
promptRouter.post(
  "/ask",
  aiLimiter,
  [body("question").notEmpty().isLength({ max: 1000 })],
  validate,
  PromptCtrl.askQuestion,
);
promptRouter.get("/history", PromptCtrl.getMyHistory);
promptRouter.get("/admin/all", adminOnly, PromptCtrl.getAllPrompts);

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(protect, adminOnly);
// Users
adminRouter.get("/users", async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const { rows, total } = await UserModel.getAll({
      role,
      status,
      search,
      page,
      limit,
    });
    paginated(res, rows, { total, page, limit });
  } catch (err) {
    next(err);
  }
});
adminRouter.patch(
  "/users/:id/status",
  auditLog("update_user_status"),
  [body("status").isIn(["active", "suspended"])],
  validate,
  async (req, res, next) => {
    try {
      await UserModel.updateStatus(req.params.id, req.body.status);
      success(res, null, `User ${req.body.status}.`);
    } catch (err) {
      next(err);
    }
  },
);
adminRouter.patch(
  "/users/:id/role",
  auditLog("update_user_role"),
  [body("role").isIn(["user", "history_keeper", "ceremony_keeper", "admin"])],
  validate,
  async (req, res, next) => {
    try {
      await UserModel.updateRole(req.params.id, req.body.role);
      success(res, null, "User role updated.");
    } catch (err) {
      next(err);
    }
  },
);
// ─── New user routes: create, full-update, delete
adminRouter.post(
  "/users",
  auditLog("create_user"),
  [
    body("name").exists().notEmpty().withMessage("Name is required"),
    body("email").exists().isEmail().withMessage("Valid email is required"),
    body("password")
      .exists()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .exists()
      .isIn(["user", "history_keeper", "ceremony_keeper", "admin"])
      .withMessage("Invalid role"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const name = req.body.name ?? null;
      const email = req.body.email ?? null;
      const password = req.body.password ?? null;
      const role = req.body.role ?? "user";
      if (await UserModel.findByEmail(email))
        throw new AppError("Email already registered.", 409);
      const password_hash = await hashPassword(password);
      const result = await UserModel.create({
        name,
        email,
        password_hash,
        role,
      });
      const user = await UserModel.findById(result.insertId);
      created(res, user, "User created.");
    } catch (err) {
      next(err);
    }
  },
);
adminRouter.put(
  "/users/:id",
  auditLog("update_user"),
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("role").isIn(["user", "history_keeper", "ceremony_keeper", "admin"]),
    body("status").isIn(["active", "suspended"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, role, status } = req.body;
      const existing = await UserModel.findByEmail(email);
      if (existing && existing.id !== Number(req.params.id))
        throw new AppError("Email already used by another account.", 409);
      await UserModel.updateFull(req.params.id, { name, email, role, status });
      success(res, await UserModel.findById(req.params.id), "User updated.");
    } catch (err) {
      next(err);
    }
  },
);
adminRouter.delete("/users/:id", auditLog("delete_user"), async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id)
      throw new AppError("You cannot delete your own account.", 400);
    await UserModel.delete(req.params.id);
    success(res, null, "User deleted.");
  } catch (err) {
    next(err);
  }
});
// Cinema (admin all-status view)
adminRouter.get("/cinema", async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const { rows, total } = await CinemaModel.getAll({
      type,
      status,
      page: Number(page),
      limit: Number(limit),
    });
    paginated(res, rows, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});
// Imvunulo presets
adminRouter.get("/imvunulo-presets", async (_req, res, next) => {
  try {
    success(res, await ImvunuloModel.getPresets());
  } catch (err) {
    next(err);
  }
});
adminRouter.post(
  "/imvunulo-presets",
  auditLog("create_imvunulo_preset"),
  [body("name").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const result = await ImvunuloModel.createPreset(req.body);
      created(res, { id: result.insertId, ...req.body });
    } catch (err) {
      next(err);
    }
  },
);
adminRouter.put("/imvunulo-presets/:id", auditLog("update_imvunulo_preset"), async (req, res, next) => {
  try {
    await ImvunuloModel.updatePreset(req.params.id, req.body);
    success(res, null, "Preset updated.");
  } catch (err) {
    next(err);
  }
});
// Tourism (tourist sites / lodges — Objective 1)
adminRouter.get("/tourism", async (_req, res, next) => {
  try { success(res, await TourismModel.getAllAdmin()); } catch (err) { next(err); }
});
adminRouter.post(
  "/tourism",
  auditLog("create_tourist_site"),
  [body("name").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const result = await TourismModel.create({ ...req.body, created_by: req.user.id });
      created(res, { id: result.insertId, ...req.body });
    } catch (err) { next(err); }
  },
);
adminRouter.put("/tourism/:id", auditLog("update_tourist_site"), async (req, res, next) => {
  try {
    await TourismModel.update(req.params.id, req.body);
    success(res, null, "Site updated.");
  } catch (err) { next(err); }
});
adminRouter.delete("/tourism/:id", auditLog("delete_tourist_site"), async (req, res, next) => {
  try {
    await TourismModel.delete(req.params.id);
    success(res, null, "Site removed.");
  } catch (err) { next(err); }
});
// System config
adminRouter.get("/config", async (_req, res, next) => {
  try {
    success(res, await ConfigModel.getAll());
  } catch (err) {
    next(err);
  }
});
adminRouter.put(
  "/config/:key",
  auditLog("update_config"),
  [body("value").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      await ConfigModel.upsert(req.params.key, req.body.value);
      success(res, null, "Config updated.");
    } catch (err) {
      next(err);
    }
  },
);
// Analytics
adminRouter.get("/analytics/summary", async (_req, res, next) => {
  try {
    const { query } = await import("../config/db.js");
    const [userCounts, contentCounts, promptStats, bookingStats] =
      await Promise.all([
        UserModel.countByRole(),
        query(
          `SELECT status, COUNT(*) AS count FROM ceremonies GROUP BY status`,
        ),
        query(
          `SELECT source, COUNT(*) AS count FROM ai_prompts GROUP BY source`,
        ),
        query(
          `SELECT DATE(booked_at) AS date, COUNT(*) AS count FROM bookings GROUP BY DATE(booked_at) ORDER BY date DESC LIMIT 30`,
        ),
      ]);
    success(res, { userCounts, contentCounts, promptStats, bookingStats });
  } catch (err) {
    next(err);
  }
});
// Audit log
adminRouter.get("/audit-log", async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const logs = await AuditLogModel.getAll({
      page: Number(page),
      limit: Number(limit),
    });
    success(res, logs);
  } catch (err) {
    next(err);
  }
});

// ─── OLLAMA ROUTES (admin only) ───────────────────────────────────────────────
adminRouter.get("/ollama/status", async (_req, res) => {
  const available = await isOllamaAvailable();
  let models = [];
  if (available) {
    try { models = await listOllamaModels(); } catch {}
  }
  const currentModel = await ConfigModel.get("ollama_model").catch(() => null);
  success(res, { available, models, currentModel: currentModel || "phi4-mini" });
});

adminRouter.put("/ollama/model", async (req, res, next) => {
  try {
    const { model } = req.body;
    if (!model) return res.status(400).json({ message: "Model name required." });
    await ConfigModel.upsert("ollama_model", model);
    success(res, null, `Ollama model set to ${model}.`);
  } catch (err) { next(err); }
});

adminRouter.post("/ollama/test", async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: "Question required." });
    const docs = getRelevantDocs(question, 4);
    const systemPrompt = buildRagPrompt(docs);
    const answer = await generateWithOllama(systemPrompt, question);
    success(res, { answer, docsUsed: docs.length });
  } catch (err) {
    res.status(503).json({ success: false, message: err.message });
  }
});

// ─── RATINGS (admin view) ─────────────────────────────────────────────────────
adminRouter.get("/ratings", async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { rows, total } = await RatingsModel.getAll({ page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});

// ─── ML MODEL ROUTES (admin only) ────────────────────────────────────────────
adminRouter.get("/ml/status", (_req, res) => {
  const info = getModelInfo();
  success(res, info || { untrained: true });
});

adminRouter.post("/ml/train", async (req, res) => {
  const logs = [];
  try {
    const stats = await trainModel((msg) => logs.push(msg));
    clearPredictorCache();
    success(res, { stats, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, logs });
  }
});

adminRouter.post("/ml/test", (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: 'Question required.' });
  const result = predictAnswer(question);
  success(res, result || { answer: 'No trained model found or no matching results.', source: 'local' });
});

// ─── SERVICES (marketplace) ────────────────────────────────────────────────────
const servicesRouter = Router();
servicesRouter.get("/", async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const { rows, total } = await ServicesModel.getAll({ category, page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});
servicesRouter.get("/mine", protect, practitionersOnly, async (req, res, next) => {
  try { success(res, await ServicesModel.findByPractitioner(req.user.id)); } catch (err) { next(err); }
});
servicesRouter.get("/my-enquiries", protect, practitionersOnly, async (req, res, next) => {
  try { success(res, await ServicesModel.getEnquiriesForPractitioner(req.user.id)); } catch (err) { next(err); }
});
servicesRouter.get("/my-sent-enquiries", protect, async (req, res, next) => {
  try { success(res, await ServicesModel.getUserEnquiries(req.user.id)); } catch (err) { next(err); }
});
servicesRouter.get("/enquiries/:id/messages", protect, async (req, res, next) => {
  try {
    const enq = await ServicesModel.getEnquiryById(req.params.id);
    if (!enq) throw new AppError("Enquiry not found.", 404);
    if (enq.user_id !== req.user.id && enq.practitioner_id !== req.user.id)
      throw new AppError("Forbidden.", 403);
    const messages = await ServicesModel.getMessages(req.params.id);
    success(res, { enquiry: enq, messages });
  } catch (err) { next(err); }
});
servicesRouter.post(
  "/enquiries/:id/messages",
  protect,
  [body("body").notEmpty().withMessage("Message body is required.")],
  validate,
  async (req, res, next) => {
    try {
      const enq = await ServicesModel.getEnquiryById(req.params.id);
      if (!enq) throw new AppError("Enquiry not found.", 404);
      if (enq.user_id !== req.user.id && enq.practitioner_id !== req.user.id)
        throw new AppError("Forbidden.", 403);
      await ServicesModel.addMessage(req.params.id, req.user.id, req.body.body);
      success(res, null, "Message sent.");
    } catch (err) { next(err); }
  },
);
servicesRouter.get("/:id", async (req, res, next) => {
  try {
    const svc = await ServicesModel.findById(req.params.id);
    if (!svc) throw new AppError("Service not found.", 404);
    success(res, svc);
  } catch (err) { next(err); }
});
servicesRouter.post(
  "/",
  protect,
  practitionersOnly,
  [body("title").notEmpty(), body("category").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, category, price_range, contact, image_url } = req.body;
      const result = await ServicesModel.create({ practitioner_id: req.user.id, title, description, category, price_range, contact, image_url });
      created(res, { id: result.insertId, title, category }, "Service listed.");
    } catch (err) { next(err); }
  },
);
servicesRouter.put("/:id", protect, practitionersOnly, async (req, res, next) => {
  try {
    const svc = await ServicesModel.findById(req.params.id);
    if (!svc) throw new AppError("Service not found.", 404);
    if (svc.practitioner_id !== req.user.id) throw new AppError("Forbidden.", 403);
    await ServicesModel.update(req.params.id, req.body);
    success(res, null, "Service updated.");
  } catch (err) { next(err); }
});
servicesRouter.delete("/:id", protect, practitionersOnly, async (req, res, next) => {
  try {
    const svc = await ServicesModel.findById(req.params.id);
    if (!svc) throw new AppError("Service not found.", 404);
    if (svc.practitioner_id !== req.user.id) throw new AppError("Forbidden.", 403);
    await ServicesModel.delete(req.params.id);
    success(res, null, "Service removed.");
  } catch (err) { next(err); }
});
servicesRouter.post(
  "/:id/enquire",
  protect,
  [body("message").notEmpty(), body("user_email").isEmail()],
  validate,
  async (req, res, next) => {
    try {
      const svc = await ServicesModel.findById(req.params.id);
      if (!svc) throw new AppError("Service not found.", 404);
      if (svc.practitioner_id === req.user.id)
        throw new AppError("You cannot send an enquiry about your own service.", 403);
      const { message, user_email } = req.body;
      await ServicesModel.createEnquiry({
        service_id: req.params.id,
        user_id: req.user.id,
        user_name: req.user.name,
        user_email,
        message,
      });
      success(res, null, "Enquiry sent.");
      // Notify practitioner (fire-and-forget)
      UserModel.findById(svc.practitioner_id).then(practitioner => {
        if (!practitioner?.email) return;
        const { subject, html } = newEnquiryEmail({
          serviceName: svc.title,
          practitionerName: practitioner.name,
          userName: req.user.name,
          userEmail: user_email,
          message,
        });
        sendMail({ to: practitioner.notification_email || practitioner.email, subject, html });
      }).catch(() => {});
    } catch (err) { next(err); }
  },
);

// ─── IMVUNULO LISTINGS (rental/sale catalogue) ─────────────────────────────────
const imvunuloListingsRouter = Router();
imvunuloListingsRouter.get("/", async (req, res, next) => {
  try {
    const { listing_type, gender, page = 1, limit = 20 } = req.query;
    const { rows, total } = await ImvunuloListingModel.getAll({ listing_type, gender, page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});
imvunuloListingsRouter.get("/mine", protect, practitionersOnly, async (req, res, next) => {
  try { success(res, await ImvunuloListingModel.findByPractitioner(req.user.id)); } catch (err) { next(err); }
});
imvunuloListingsRouter.get("/my-enquiries", protect, practitionersOnly, async (req, res, next) => {
  try { success(res, await ImvunuloListingModel.getEnquiriesForPractitioner(req.user.id)); } catch (err) { next(err); }
});
imvunuloListingsRouter.get("/my-sent-enquiries", protect, async (req, res, next) => {
  try { success(res, await ImvunuloListingModel.getUserEnquiries(req.user.id)); } catch (err) { next(err); }
});
imvunuloListingsRouter.get("/enquiries/:id/messages", protect, async (req, res, next) => {
  try {
    const enq = await ImvunuloListingModel.getEnquiryById(req.params.id);
    if (!enq) throw new AppError("Enquiry not found.", 404);
    if (enq.user_id !== req.user.id && enq.practitioner_id !== req.user.id)
      throw new AppError("Forbidden.", 403);
    const messages = await ImvunuloListingModel.getMessages(req.params.id);
    success(res, { enquiry: enq, messages });
  } catch (err) { next(err); }
});
imvunuloListingsRouter.post(
  "/enquiries/:id/messages",
  protect,
  [body("body").notEmpty().withMessage("Message body is required.")],
  validate,
  async (req, res, next) => {
    try {
      const enq = await ImvunuloListingModel.getEnquiryById(req.params.id);
      if (!enq) throw new AppError("Enquiry not found.", 404);
      if (enq.user_id !== req.user.id && enq.practitioner_id !== req.user.id)
        throw new AppError("Forbidden.", 403);
      await ImvunuloListingModel.addMessage(req.params.id, req.user.id, req.body.body);
      success(res, null, "Message sent.");
    } catch (err) { next(err); }
  },
);
imvunuloListingsRouter.get("/:id", async (req, res, next) => {
  try {
    const listing = await ImvunuloListingModel.findById(req.params.id);
    if (!listing) throw new AppError("Listing not found.", 404);
    success(res, listing);
  } catch (err) { next(err); }
});
imvunuloListingsRouter.post(
  "/",
  protect,
  practitionersOnly,
  [body("title").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, listing_type, gender, price, price_unit, image_url, location_name, latitude, longitude, contact } = req.body;
      const result = await ImvunuloListingModel.create({
        practitioner_id: req.user.id, title, description, listing_type, gender,
        price, price_unit, image_url, location_name, latitude, longitude, contact,
      });
      created(res, { id: result.insertId, title }, "Listing created.");
    } catch (err) { next(err); }
  },
);
imvunuloListingsRouter.put("/:id", protect, practitionersOnly, async (req, res, next) => {
  try {
    const listing = await ImvunuloListingModel.findById(req.params.id);
    if (!listing) throw new AppError("Listing not found.", 404);
    if (listing.practitioner_id !== req.user.id) throw new AppError("Forbidden.", 403);
    await ImvunuloListingModel.update(req.params.id, req.body);
    success(res, null, "Listing updated.");
  } catch (err) { next(err); }
});
imvunuloListingsRouter.delete("/:id", protect, practitionersOnly, async (req, res, next) => {
  try {
    const listing = await ImvunuloListingModel.findById(req.params.id);
    if (!listing) throw new AppError("Listing not found.", 404);
    if (listing.practitioner_id !== req.user.id) throw new AppError("Forbidden.", 403);
    await ImvunuloListingModel.delete(req.params.id);
    success(res, null, "Listing removed.");
  } catch (err) { next(err); }
});
imvunuloListingsRouter.post(
  "/:id/enquire",
  protect,
  [body("message").notEmpty(), body("user_email").isEmail()],
  validate,
  async (req, res, next) => {
    try {
      const listing = await ImvunuloListingModel.findById(req.params.id);
      if (!listing) throw new AppError("Listing not found.", 404);
      if (listing.practitioner_id === req.user.id)
        throw new AppError("You cannot send an enquiry about your own listing.", 403);
      const { message, user_email } = req.body;
      await ImvunuloListingModel.createEnquiry({
        listing_id: req.params.id,
        user_id: req.user.id,
        user_name: req.user.name,
        user_email,
        message,
      });
      success(res, null, "Enquiry sent.");
      // Notify practitioner in-app + email (fire-and-forget)
      notify({
        user_id: listing.practitioner_id,
        type: "imvunulo_enquiry",
        title: "New imvunulo enquiry",
        body: `${req.user.name} is interested in "${listing.title}".`,
        link: "/practitioner/notifications",
      });
      UserModel.findById(listing.practitioner_id).then(practitioner => {
        if (!practitioner?.email) return;
        const { subject, html } = imvunuloListingEnquiryEmail({
          listingTitle: listing.title,
          practitionerName: practitioner.name,
          userName: req.user.name,
          userEmail: user_email,
          message,
        });
        sendMail({ to: practitioner.notification_email || practitioner.email, subject, html });
      }).catch(() => {});
    } catch (err) { next(err); }
  },
);

// ─── TOURISM (public browse) ───────────────────────────────────────────────────
const tourismRouter = Router();
tourismRouter.get("/", async (req, res, next) => {
  try {
    const { category, page = 1, limit = 30 } = req.query;
    const { rows, total } = await TourismModel.getAll({ category, page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});
tourismRouter.get("/:id", async (req, res, next) => {
  try {
    const site = await TourismModel.findById(req.params.id);
    if (!site) throw new AppError("Site not found.", 404);
    success(res, site);
  } catch (err) { next(err); }
});

// ─── PUBLICATIONS (Library — mini Google Scholar) ──────────────────────────────
const publicationsRouter = Router();
publicationsRouter.get("/", async (req, res, next) => {
  try {
    const { search, publication_type, page = 1, limit = 20 } = req.query;
    const { rows, total } = await PublicationsModel.getPublished({ search, publication_type, page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});
publicationsRouter.get("/:id", async (req, res, next) => {
  try {
    const pub = await PublicationsModel.findById(req.params.id);
    if (!pub || pub.status !== "published") throw new AppError("Publication not found.", 404);
    success(res, pub);
    PublicationsModel.incrementViews(req.params.id).catch(() => {});
  } catch (err) { next(err); }
});
publicationsRouter.use(protect);
publicationsRouter.get("/mine/all", practitionersOnly, async (req, res, next) => {
  try { success(res, await PublicationsModel.findByCreator(req.user.id)); } catch (err) { next(err); }
});
publicationsRouter.get("/admin/all", adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 15 } = req.query;
    const { rows, total } = await PublicationsModel.getAllAdmin({ status, page: +page, limit: +limit });
    paginated(res, rows, { total, page: +page, limit: +limit });
  } catch (err) { next(err); }
});
publicationsRouter.post(
  "/",
  practitionersOnly,
  [body("title").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const result = await PublicationsModel.create({ ...req.body, created_by: req.user.id });
      const pub = await PublicationsModel.findById(result.insertId);
      created(res, pub, "Publication submitted for review.");
      UserModel.getAdmins().then(admins => {
        admins.forEach(admin => {
          const { subject, html } = pendingReviewEmail({
            contentType: "Publication", title: pub.title,
            practitionerName: req.user.name, adminName: admin.name,
          });
          sendMail({ to: admin.notification_email || admin.email, subject, html });
        });
      }).catch(() => {});
    } catch (err) { next(err); }
  },
);
publicationsRouter.put("/:id", practitionersOnly, async (req, res, next) => {
  try {
    const pub = await PublicationsModel.findById(req.params.id);
    if (!pub) throw new AppError("Publication not found.", 404);
    if (pub.created_by !== req.user.id) throw new AppError("You can only edit your own publications.", 403);
    if (pub.status === "published" || pub.status === "rejected")
      await PublicationsModel.updateStatus(req.params.id, "pending_review", null, null);
    await PublicationsModel.update(req.params.id, req.body);
    success(res, null, "Publication updated and resubmitted for review.");
  } catch (err) { next(err); }
});
publicationsRouter.delete("/:id", practitionersOnly, async (req, res, next) => {
  try {
    const pub = await PublicationsModel.findById(req.params.id);
    if (!pub) throw new AppError("Publication not found.", 404);
    if (pub.created_by !== req.user.id) throw new AppError("You can only remove your own publications.", 403);
    await PublicationsModel.delete(req.params.id);
    success(res, null, "Publication removed.");
  } catch (err) { next(err); }
});
publicationsRouter.patch(
  "/:id/review",
  adminOnly,
  auditLog("review_publication"),
  [body("status").isIn(["published", "rejected", "pending_review"])],
  validate,
  async (req, res, next) => {
    try {
      const pub = await PublicationsModel.findById(req.params.id);
      await PublicationsModel.updateStatus(req.params.id, req.body.status, req.user.id, req.body.rejection_note);
      success(res, null, `Publication ${req.body.status}.`);
      if (pub && (req.body.status === "published" || req.body.status === "rejected")) {
        UserModel.findById(pub.created_by).then(author => {
          if (!author?.email) return;
          const { subject, html } = contentReviewedEmail({
            contentType: "Publication", title: pub.title,
            status: req.body.status, rejectionNote: req.body.rejection_note,
            practitionerName: author.name,
          });
          sendMail({ to: author.notification_email || author.email, subject, html });
        }).catch(() => {});
      }
    } catch (err) { next(err); }
  },
);

// ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────
const recommendationsRouter = Router();
recommendationsRouter.get("/", protect, async (req, res, next) => {
  try {
    const prefs = await PreferencesModel.findByUser(req.user.id);
    // Budget-based imvunulo recommendations (Objective 2) run independently of
    // cultural interests — a user can set a budget without picking any interest tags.
    const budgetRecs = prefs?.imvunulo_budget_max
      ? query(
          `SELECT l.*, u.name AS practitioner_name FROM imvunulo_listings l
           JOIN users u ON l.practitioner_id = u.id
           WHERE l.status = 'active' AND l.price IS NOT NULL AND l.price <= ?
           ORDER BY l.price DESC LIMIT 6`,
          [prefs.imvunulo_budget_max],
        )
      : Promise.resolve([]);

    if (!prefs) {
      const imvunulo = await budgetRecs;
      return success(res, { ceremonies: [], lineage: [], imvunulo, noPreferences: true });
    }
    const interests = Array.isArray(prefs.interests)
      ? prefs.interests
      : (JSON.parse(prefs.interests || '[]'));
    if (!interests.length) {
      const imvunulo = await budgetRecs;
      return success(res, { ceremonies: [], lineage: [], imvunulo, noPreferences: !prefs.imvunulo_budget_max });
    }

    // 'ceremonies'/'lineage' interests mean "all of that content type" — most rows
    // never get an explicit `category` tag (it's an optional field on the form), so
    // matching on category alone made the list barely change no matter which
    // interests were picked. Widen matching to also cover the content's own type
    // and a keyword search over the text fields for the other interests.
    const wantsCeremonies = interests.includes('ceremonies');
    const wantsLineage = interests.includes('lineage');
    const tagInterests = interests.filter(i => i !== 'ceremonies' && i !== 'lineage');

    const buildConditions = (fields) => {
      const conditions = [];
      const params = [];
      if (tagInterests.length) {
        conditions.push(`category IN (${tagInterests.map(() => '?').join(',')})`);
        params.push(...tagInterests);
      }
      tagInterests.forEach((interest) => {
        conditions.push(`(${fields.map(f => `${f} LIKE ?`).join(' OR ')})`);
        params.push(...fields.map(() => `%${interest}%`));
      });
      return { conditions, params };
    };

    const ceremonyMatch = buildConditions(['c.name', 'c.description', 'c.swati_name', 'c.swati_description']);
    if (wantsCeremonies) ceremonyMatch.conditions.push('1');

    const lineageMatch = buildConditions(['lr.title', 'lr.description', 'lr.swati_title', 'lr.swati_description']);
    if (wantsLineage) lineageMatch.conditions.push('1');

    const [ceremonies, lineage, imvunulo, tourism] = await Promise.all([
      ceremonyMatch.conditions.length
        ? query(
            `SELECT c.*, u.name AS creator_name FROM ceremonies c
             JOIN users u ON c.created_by = u.id
             WHERE c.status = 'published' AND (${ceremonyMatch.conditions.join(' OR ')})
             ORDER BY c.created_at DESC LIMIT 6`,
            ceremonyMatch.params,
          )
        : Promise.resolve([]),
      lineageMatch.conditions.length
        ? query(
            `SELECT lr.*, u.name AS creator_name FROM lineage_records lr
             JOIN users u ON lr.created_by = u.id
             WHERE lr.status = 'published' AND (${lineageMatch.conditions.join(' OR ')})
             ORDER BY lr.created_at DESC LIMIT 4`,
            lineageMatch.params,
          )
        : Promise.resolve([]),
      budgetRecs,
      TourismModel.getRecommended(tagInterests),
    ]);
    success(res, { ceremonies, lineage, imvunulo, tourism, interests });
  } catch (err) { next(err); }
});

// ─── USER GUIDE (role-filtered) ────────────────────────────────────────────────
const GUIDE_PATH = path.join(__dirname, "..", "..", "..", "USER_GUIDE.html");
const GUIDE_ROLES = ["public", "user", "ceremony_keeper", "history_keeper", "admin"];

const guideRouter = Router();
guideRouter.get("/", (req, res, next) => {
  try {
    const role = GUIDE_ROLES.includes(req.query.role) ? req.query.role : "public";
    const raw = fs.readFileSync(GUIDE_PATH, "utf8");

    const styleMatch = raw.match(/<style>[\s\S]*?<\/style>/);
    const style = styleMatch ? styleMatch[0] : "";

    const coverStart = raw.indexOf('<!-- ══════════════ COVER ══════════════ -->');
    const firstSectionStart = raw.indexOf('<section id=');
    const coverAndToc = coverStart >= 0 && firstSectionStart >= 0 ? raw.slice(coverStart, firstSectionStart) : "";

    const footerStart = raw.indexOf('<!-- ══════════════ FOOTER ══════════════ -->');
    const bodyEnd = raw.indexOf('</body>');
    const footer = footerStart >= 0 && bodyEnd >= 0 ? raw.slice(footerStart, bodyEnd) : "";

    const sections = [];
    const sectionRe = /<section id="([\w-]+)" class="guide-section" data-roles="([^"]+)">([\s\S]*?)<\/section>/g;
    let m;
    while ((m = sectionRe.exec(raw))) {
      const [, id, rolesAttr, body] = m;
      if (rolesAttr.split(",").includes(role)) {
        sections.push(`<section id="${id}" class="guide-section">${body}</section>`);
      }
    }

    const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>User Guide</title>${style}</head><body>${coverAndToc}${sections.join("\n")}${footer}</body></html>`;
    success(res, { html, role });
  } catch (err) { next(err); }
});

// ─── AGGREGATE ROUTER ─────────────────────────────────────────────────────────
router.use("/auth", authRouter);
router.use("/ceremonies", ceremonyRouter);
router.use("/lineage", lineageRouter);
router.use("/clans", clanRouter);
router.use("/cinema", cinemaRouter);
router.use("/seminars", seminarRouter);
router.use("/notifications", notificationsRouter);
router.use("/prompts", promptRouter);
router.use("/admin", adminRouter);
router.use("/services", servicesRouter);
router.use("/imvunulo-listings", imvunuloListingsRouter);
router.use("/tourism", tourismRouter);
router.use("/publications", publicationsRouter);
router.use("/recommendations", recommendationsRouter);
router.use("/guide", guideRouter);

export default router;

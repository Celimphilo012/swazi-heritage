import { Router } from "express";
import { body } from "express-validator";
import multer from "multer";
import path from "path";
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
    const allowed = /\.(jpe?g|png|gif|webp|mp3|wav|ogg|m4a|aac)$/i;
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
  ImvunuloModel,
  UserModel,
  ConfigModel,
  AuditLogModel,
} from "../models/models.js";
import { success, created, paginated, AppError } from "../utils/apiResponse.js";

const router = Router();

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
      const { name, bio, avatar_url } = req.body;
      await UserModel.updateProfile(req.user.id, { name, bio, avatar_url });
      success(res, await UserModel.findById(req.user.id), "Profile updated.");
    } catch (err) {
      next(err);
    }
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
  [body("status").isIn(["published", "rejected", "pending_review"])],
  validate,
  CeremonyCtrl.reviewCeremony,
);
ceremonyRouter.get("/admin/all", adminOnly, CeremonyCtrl.getAllCeremonies);

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
lineageRouter.use(protect);
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
      const result = await LineageModel.create({
        ...req.body,
        created_by: req.user.id,
      });
      const record = await LineageModel.findById(result.insertId);
      created(res, record, "Lineage record submitted for review.");
    } catch (err) {
      next(err);
    }
  },
);
lineageRouter.put("/:id", historyKeeperOnly, async (req, res, next) => {
  try {
    await LineageModel.update(req.params.id, req.body);
    success(res, null, "Lineage record updated.");
  } catch (err) {
    next(err);
  }
});
lineageRouter.patch(
  "/:id/review",
  adminOnly,
  [body("status").isIn(["published", "rejected", "pending_review"])],
  validate,
  async (req, res, next) => {
    try {
      await LineageModel.updateStatus(
        req.params.id,
        req.body.status,
        req.user.id,
        req.body.rejection_note,
      );
      success(res, null, `Lineage record ${req.body.status}.`);
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
      status: "scheduled",
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
  [
    body("title").notEmpty(),
    body("type").isIn(["live", "recorded"]),
    body("stream_url").isURL(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await CinemaModel.create({
        ...req.body,
        created_by: req.user.id,
      });
      created(res, { id: result.insertId, ...req.body });
    } catch (err) {
      next(err);
    }
  },
);
cinemaRouter.put("/:id", adminOnly, async (req, res, next) => {
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
adminRouter.delete("/users/:id", async (req, res, next) => {
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
adminRouter.put("/imvunulo-presets/:id", async (req, res, next) => {
  try {
    await ImvunuloModel.updatePreset(req.params.id, req.body);
    success(res, null, "Preset updated.");
  } catch (err) {
    next(err);
  }
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

// ─── AGGREGATE ROUTER ─────────────────────────────────────────────────────────
router.use("/auth", authRouter);
router.use("/ceremonies", ceremonyRouter);
router.use("/lineage", lineageRouter);
router.use("/clans", clanRouter);
router.use("/cinema", cinemaRouter);
router.use("/prompts", promptRouter);
router.use("/admin", adminRouter);

export default router;

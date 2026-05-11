import api from "./axiosInstance";

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = (params) =>
  api.get("/admin/users", { params }).then((r) => r.data);

export const createUser = (data) =>
  api.post("/admin/users", data).then((r) => r.data.data);

export const updateUser = (id, data) =>
  api.put(`/admin/users/${id}`, data).then((r) => r.data.data);

export const updateUserStatus = (id, status) =>
  api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data);

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`).then((r) => r.data);

// ─── Content review ───────────────────────────────────────────────────────────
export const getAdminCeremonies = (params) =>
  api.get("/ceremonies/admin/all", { params }).then((r) => r.data);

export const reviewCeremony = (id, data) =>
  api.patch(`/ceremonies/${id}/review`, data).then((r) => r.data);

export const getAdminLineage = (params) =>
  api.get("/lineage/admin/all", { params }).then((r) => r.data);

export const reviewLineage = (id, data) =>
  api.patch(`/lineage/${id}/review`, data).then((r) => r.data);

// ─── Analytics & Audit ───────────────────────────────────────────────────────
export const getAnalyticsSummary = () =>
  api.get("/admin/analytics/summary").then((r) => r.data.data);

export const getAuditLog = (params) =>
  api.get("/admin/audit-log", { params }).then((r) => r.data.data);

// ─── Cinema management ───────────────────────────────────────────────────────
export const getAdminCinema = (params) =>
  api.get("/admin/cinema", { params }).then((r) => r.data);

export const createCinema = (data) =>
  api.post("/cinema", data).then((r) => r.data.data);

export const updateCinema = (id, data) =>
  api.put(`/cinema/${id}`, data).then((r) => r.data);

// ─── System config ────────────────────────────────────────────────────────────
export const getConfig = () =>
  api.get("/admin/config").then((r) => r.data.data);

export const updateConfig = (key, value) =>
  api.put(`/admin/config/${key}`, { value }).then((r) => r.data);

// ─── Imvunulo presets ────────────────────────────────────────────────────────
export const getImvunuloPresets = () =>
  api.get("/admin/imvunulo-presets").then((r) => r.data.data);

export const createImvunuloPreset = (data) =>
  api.post("/admin/imvunulo-presets", data).then((r) => r.data.data);

export const updateImvunuloPreset = (id, data) =>
  api.put(`/admin/imvunulo-presets/${id}`, data).then((r) => r.data);

// ─── Ollama ───────────────────────────────────────────────────────────────────
export const getOllamaStatus = () =>
  api.get("/admin/ollama/status").then((r) => r.data.data);

export const setOllamaModel = (model) =>
  api.put("/admin/ollama/model", { model }).then((r) => r.data);

export const testOllama = (question) =>
  api.post("/admin/ollama/test", { question }).then((r) => r.data.data);

// ─── ML Model ────────────────────────────────────────────────────────────────
export const getModelStatus = () =>
  api.get("/admin/ml/status").then((r) => r.data.data);

export const trainMLModel = () =>
  api.post("/admin/ml/train").then((r) => r.data.data);

export const testMLModel = (question) =>
  api.post("/admin/ml/test", { question }).then((r) => r.data.data);

import api from "./axiosInstance";

// ─── Ceremonies ───────────────────────────────────────────────────────────────
export const getPublishedCeremonies = (params) =>
  api.get("/ceremonies", { params }).then((r) => r.data);

export const getCeremony = (id) =>
  api.get(`/ceremonies/${id}`).then((r) => r.data.data);

export const getMyCeremonies = (status) =>
  api
    .get("/ceremonies/mine/all", { params: { status } })
    .then((r) => r.data.data);

export const createCeremony = (data) =>
  api.post("/ceremonies", data).then((r) => r.data.data);

export const updateCeremony = (id, data) =>
  api.put(`/ceremonies/${id}`, data).then((r) => r.data.data);

// ─── Songs ────────────────────────────────────────────────────────────────────
export const addSong = (ceremonyId, data) =>
  api.post(`/ceremonies/${ceremonyId}/songs`, data).then((r) => r.data.data);

export const deleteSong = (ceremonyId, songId) =>
  api.delete(`/ceremonies/${ceremonyId}/songs/${songId}`);

// ─── Imvunulo ─────────────────────────────────────────────────────────────────
export const addImvunulo = (ceremonyId, data) =>
  api.post(`/ceremonies/${ceremonyId}/imvunulo`, data).then((r) => r.data.data);

export const deleteImvunulo = (ceremonyId, imvId) =>
  api.delete(`/ceremonies/${ceremonyId}/imvunulo/${imvId}`);

// ─── Resources for the form ───────────────────────────────────────────────────
export const getImvunuloPresets = () =>
  api.get("/ceremonies/resources/presets").then((r) => r.data.data);

export const getCeremonyMonths = () =>
  api.get("/ceremonies/resources/months").then((r) => r.data.data);

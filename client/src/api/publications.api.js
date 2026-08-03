import api from "./axiosInstance";

export const getPublications = (params) =>
  api.get("/publications", { params }).then((r) => r.data);

export const getPublication = (id) =>
  api.get(`/publications/${id}`).then((r) => r.data.data);

export const getMyPublications = () =>
  api.get("/publications/mine/all").then((r) => r.data.data);

export const createPublication = (data) =>
  api.post("/publications", data).then((r) => r.data.data);

export const updatePublication = (id, data) =>
  api.put(`/publications/${id}`, data).then((r) => r.data);

export const deletePublication = (id) =>
  api.delete(`/publications/${id}`).then((r) => r.data);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdminPublications = (params) =>
  api.get("/publications/admin/all", { params }).then((r) => r.data);

export const reviewPublication = (id, data) =>
  api.patch(`/publications/${id}/review`, data).then((r) => r.data);

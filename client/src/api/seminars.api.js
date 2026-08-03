import api from "./axiosInstance";

// ─── Public / user ────────────────────────────────────────────────────────────
export const getSeminars = (params) =>
  api.get("/seminars", { params }).then((r) => r.data);

export const getSeminar = (id) =>
  api.get(`/seminars/${id}`).then((r) => r.data.data);

export const bookSeminar = (id) =>
  api.post(`/seminars/${id}/book`).then((r) => r.data);

export const getMySeminarBookings = () =>
  api.get("/seminars/my/bookings").then((r) => r.data.data);

export const cancelSeminarBooking = (id) =>
  api.patch(`/seminars/bookings/${id}/cancel`).then((r) => r.data);

// ─── Practitioner ─────────────────────────────────────────────────────────────
export const getMySeminars = () =>
  api.get("/seminars/mine/all").then((r) => r.data.data);

export const createSeminar = (data) =>
  api.post("/seminars", data).then((r) => r.data.data);

export const updateSeminar = (id, data) =>
  api.put(`/seminars/${id}`, data).then((r) => r.data);

export const cancelSeminar = (id) =>
  api.patch(`/seminars/${id}/cancel`).then((r) => r.data);

export const getSeminarAttendees = (id) =>
  api.get(`/seminars/${id}/bookings`).then((r) => r.data.data);

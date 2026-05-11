import api from "./axiosInstance";

export const getCinemaSessions = (params) =>
  api.get("/cinema", { params }).then((r) => r.data);

export const getCinemaSession = (id) =>
  api.get(`/cinema/${id}`).then((r) => r.data.data);

export const bookSession = (id) =>
  api.post(`/cinema/book/${id}`).then((r) => r.data);

export const getMyBookings = () =>
  api.get("/cinema/my/bookings").then((r) => r.data.data);

export const cancelBooking = (id) =>
  api.patch(`/cinema/bookings/${id}/cancel`).then((r) => r.data);

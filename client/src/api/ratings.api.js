import api from "./axiosInstance";

export const getCeremonyRatings = (id) =>
  api.get(`/ceremonies/${id}/ratings`).then(r => r.data.data);

export const rateCeremony = (id, data) =>
  api.post(`/ceremonies/${id}/ratings`, data).then(r => r.data.data);

export const getLineageRatings = (id) =>
  api.get(`/lineage/${id}/ratings`).then(r => r.data.data);

export const rateLineage = (id, data) =>
  api.post(`/lineage/${id}/ratings`, data).then(r => r.data.data);

export const getAllRatings = (params) =>
  api.get("/admin/ratings", { params }).then(r => r.data);

export const getRecommendations = () =>
  api.get("/recommendations").then(r => r.data.data);

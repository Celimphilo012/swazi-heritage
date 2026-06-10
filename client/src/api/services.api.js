import api from "./axiosInstance";

export const getServices = (params) =>
  api.get("/services", { params }).then(r => r.data);

export const getService = (id) =>
  api.get(`/services/${id}`).then(r => r.data.data);

export const getMyServices = () =>
  api.get("/services/mine").then(r => r.data.data);

export const createService = (data) =>
  api.post("/services", data).then(r => r.data.data);

export const updateService = (id, data) =>
  api.put(`/services/${id}`, data).then(r => r.data.data);

export const deleteService = (id) =>
  api.delete(`/services/${id}`);

export const sendEnquiry = (id, data) =>
  api.post(`/services/${id}/enquire`, data).then(r => r.data);

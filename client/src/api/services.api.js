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

export const getMyEnquiries = () =>
  api.get("/services/my-enquiries").then(r => r.data.data);

export const getMySentEnquiries = () =>
  api.get("/services/my-sent-enquiries").then(r => r.data.data);

export const getEnquiryThread = (id) =>
  api.get(`/services/enquiries/${id}/messages`).then(r => r.data.data);

export const replyToEnquiry = (id, body) =>
  api.post(`/services/enquiries/${id}/messages`, { body }).then(r => r.data);

import api from "./axiosInstance";

export const getImvunuloListings = (params) =>
  api.get("/imvunulo-listings", { params }).then(r => r.data);

export const getImvunuloListing = (id) =>
  api.get(`/imvunulo-listings/${id}`).then(r => r.data.data);

export const getMyImvunuloListings = () =>
  api.get("/imvunulo-listings/mine").then(r => r.data.data);

export const createImvunuloListing = (data) =>
  api.post("/imvunulo-listings", data).then(r => r.data.data);

export const updateImvunuloListing = (id, data) =>
  api.put(`/imvunulo-listings/${id}`, data).then(r => r.data.data);

export const deleteImvunuloListing = (id) =>
  api.delete(`/imvunulo-listings/${id}`);

export const sendImvunuloEnquiry = (id, data) =>
  api.post(`/imvunulo-listings/${id}/enquire`, data).then(r => r.data);

export const getMyImvunuloEnquiries = () =>
  api.get("/imvunulo-listings/my-enquiries").then(r => r.data.data);

export const getMySentImvunuloEnquiries = () =>
  api.get("/imvunulo-listings/my-sent-enquiries").then(r => r.data.data);

export const getImvunuloEnquiryThread = (id) =>
  api.get(`/imvunulo-listings/enquiries/${id}/messages`).then(r => r.data.data);

export const replyToImvunuloEnquiry = (id, body) =>
  api.post(`/imvunulo-listings/enquiries/${id}/messages`, { body }).then(r => r.data);

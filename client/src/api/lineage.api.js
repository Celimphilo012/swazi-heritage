import api from "./axiosInstance";

export const getPublishedLineage = (params) =>
  api.get("/lineage", { params }).then((r) => r.data);

export const getLineageRecord = (id) =>
  api.get(`/lineage/${id}`).then((r) => r.data.data);

export const getMyLineageRecords = (status) =>
  api
    .get("/lineage/mine/all", { params: status ? { status } : {} })
    .then((r) => r.data.data);

export const createLineageRecord = (data) =>
  api.post("/lineage", data).then((r) => r.data.data);

export const updateLineageRecord = (id, data) =>
  api.put(`/lineage/${id}`, data).then((r) => r.data);

export const createClan = (data) =>
  api.post("/clans", data).then((r) => r.data.data);

export const updateClan = (id, data) =>
  api.put(`/clans/${id}`, data).then((r) => r.data);

export const deleteClan = (id) =>
  api.delete(`/clans/${id}`).then((r) => r.data);

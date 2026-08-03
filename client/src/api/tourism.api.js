import api from "./axiosInstance";

export const getTourismSites = (params) =>
  api.get("/tourism", { params }).then((r) => r.data);

export const getTourismSite = (id) =>
  api.get(`/tourism/${id}`).then((r) => r.data.data);

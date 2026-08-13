import api from "./axiosInstance";

export const getGuide = (role) =>
  api.get("/guide", { params: { role: role || "public" } }).then((r) => r.data.data);

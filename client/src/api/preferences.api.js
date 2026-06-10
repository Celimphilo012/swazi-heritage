import api from "./axiosInstance";

export const getPreferences = () =>
  api.get("/auth/preferences").then(r => r.data.data);

export const savePreferences = (data) =>
  api.put("/auth/preferences", data).then(r => r.data.data);

import api from "./axiosInstance";

export const uploadFile = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data.data.url);
};

import api from "./axiosInstance";

export const askQuestion = (question) =>
  api.post("/prompts/ask", { question }).then((r) => r.data.data);

export const getPromptHistory = () =>
  api.get("/prompts/history").then((r) => r.data.data);

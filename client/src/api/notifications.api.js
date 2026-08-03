import api from "./axiosInstance";

export const getNotifications = () =>
  api.get("/notifications").then((r) => r.data.data);

export const getUnreadCount = () =>
  api.get("/notifications/unread-count").then((r) => r.data.data.count);

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data);

export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all").then((r) => r.data);

import api from "../api/axios";

export const markNotificationsRead = async (payload) => {
  return api.post("/notifications/read", payload);
};

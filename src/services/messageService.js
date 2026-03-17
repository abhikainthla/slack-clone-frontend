import api from "../api/axios";

export const sendMessage = (data) => {
  return api.post("/messages", data);
};

export const getMessages = (channelId) => {
  return api.get(`/messages/${channelId}`);
};

export const searchMessages = (query) => {
  return api.get(`/messages/search?q=${query}`);
};

export const markAsRead = (channelId) => {
  return api.post(`/messages/read/${channelId}`);
};

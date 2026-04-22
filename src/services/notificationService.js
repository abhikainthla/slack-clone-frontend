import api from "../api/axios";

export const markChannelNotificationsRead = (channelId) =>
  api.post(`/notifications/read/channel/${channelId}`);

export const markDMNotificationsRead = (conversationId) =>
  api.post(`/notifications/read/dm/${conversationId}`);

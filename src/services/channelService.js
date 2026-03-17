import api from "../api/axios";

export const createChannel = (data) => {
  return api.post("/channels", data);
};

export const getChannels = (workspaceId) => {
  return api.get(`/channels/workspace/${workspaceId}`);
};


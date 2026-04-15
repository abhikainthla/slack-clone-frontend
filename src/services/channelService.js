import axios from "../api/axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); 

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const createChannel = (data) => {
  return api.post("/channels", data);
};

export const getChannels = (workspaceId) => {
  return api.get(`/channels/workspace/${workspaceId}`);
};

export const getChannelById = (channelId) => {
  return api.get(`/channels/${channelId}`);
};

export const updateChannel = (id, data) => {
  return api.put(`/channels/${id}`, data);
};

export const deleteChannel = (id) => {
  return api.delete(`/channels/${id}`);
};

export const inviteToChannel = (channelId, userId) => {
  return api.post(`/channels/invite/${channelId}`, { userId });
};

export const addModerator = (channelId, userId) => {
  return api.post(`/channels/moderator/${channelId}`, { userId });
};

export const removeModerator = (channelId, userId) => {
  return api.delete(`/channels/moderator/${channelId}`, {
    data: { userId },
  });
};


export const getWorkspaceChannels = (workspaceId) => {
  return api.get(`/channels/workspace/${workspaceId}`);
};


export const updateChannelSettings = (channelId, data) => {
  return api.put(`/channels/${channelId}/settings`, data);
};

export const updateChannelMembers = (channelId, data) => {
  return api.put(`/channels/${channelId}/members`, data);
};

export const updateChannelRole = (channelId, data) => {
  return api.put(`/channels/${channelId}/role`, data);
};

export const getChannelMembers = (channelId) => {
  return api.get(`/channels/${channelId}/members`);
};

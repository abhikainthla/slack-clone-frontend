import api from "../api/axios";


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

/* ✅ ADD MEMBER */
export const addChannelMember = (channelId, data) =>
  api.post(`/channels/${channelId}/members`, data);

/* ✅ REMOVE MEMBER (FIX THIS) */
export const removeChannelMember = (channelId, memberId) =>
  api.delete(`/channels/${channelId}/members/${memberId}`);
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

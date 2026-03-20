import api from "../api/axios";

export const createWorkspace = (data) => {
  return api.post("/workspaces", data);
};

export const getWorkspaces = () => {
  return api.get("/workspaces");
};

export const getWorkspaceById = (id) => {
  return api.get(`/workspaces/${id}`);
};

// Generate a random link
export const generateInviteLink = (workspaceId) => {
  return api.post(`/workspaces/${workspaceId}/invite-link`);
};

// Join via a token
export const joinWorkspace = (token) => {
  return api.post(`/workspaces/join/${token}`);
};

export const markWorkspaceRead = (id) => {
  return api.put(`/workspaces/${id}/mark-read`);
};

export const deleteWorkspace = (id) => {
  return api.delete(`/workspaces/${id}`);
};

export const updateWorkspace = (id, data) => {
  return api.put(`/workspaces/${id}`, data);
};



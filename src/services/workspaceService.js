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

export const inviteToWorkspace = (id, email) => {
  return api.post(`/workspaces/${id}/invite`, { email });
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



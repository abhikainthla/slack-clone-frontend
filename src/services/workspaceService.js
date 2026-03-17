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

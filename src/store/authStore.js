import { create } from "zustand";
import api from "../api/axios";

const useAuthStore = create((set) => ({
  user: null,
   token: null,

  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  hydrateUser: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data });
    } catch (err) {
      console.error("Auth hydrate failed");
      set({ user: null });
    }
  },
}));

export default useAuthStore;

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
    const token = localStorage.getItem("token");

    // Don't call API if no token
    if (!token) {
      set({ user: null, token: null });
      return;
    }

    const res = await api.get("/auth/me");

    const userData = res.data?.user || res.data;

    if (!userData?._id) {
      throw new Error("Invalid user");
    }

    set({
      user: userData,
      token,
    });

  } catch (err) {
    console.error("Auth hydrate failed");

    // ✅ ONLY logout if 401
    if (err.response?.status === 401) {
      localStorage.removeItem("token");

      set({
        user: null,
        token: null,
      });
    }
  }
},


}));

export default useAuthStore;

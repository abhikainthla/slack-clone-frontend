import { create } from "zustand";
import { enrichChannel } from "../utils/channelUtils";

const useChatStore = create((set, get) => ({
  workspace: null,
  channels: [],
  activeChannel: null,
  messages: [],
  userId: null, // ✅ NEW: Store userId directly

  /* WORKSPACE */
  setWorkspace: (workspace) => set({ workspace }),

  /* SET USER */
  setUserId: (userId) => set({ userId }),

  /* CHANNELS */
  setChannels: (channels, userId = get().userId) =>
    set((state) => {
      const updatedChannels =
        typeof channels === "function"
          ? channels(state.channels)
          : channels;

      /* ✅ ENRICH ALL CHANNELS */
      const enriched = userId
        ? updatedChannels.map((ch) => enrichChannel(ch, userId))
        : updatedChannels;

      return { channels: enriched };
    }),

  /* ACTIVE CHANNEL - FIXED */
  setActiveChannel: (channel, userId = get().userId) => {
    console.log("STORE setActiveChannel:", { channel, userId }); // 🔍 DEBUG

    // ✅ Defensive: handle null/undefined
    if (!channel || !channel._id) {
      return set({ activeChannel: null, messages: [] });
    }

    // ✅ Enrich if needed
    const finalChannel = userId ? enrichChannel(channel, userId) : channel;

    set({
      activeChannel: finalChannel,
      messages: [],
    });
  },

  /* MESSAGES */
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
}));

export default useChatStore;

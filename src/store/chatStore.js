import { create } from "zustand";
import { enrichChannel } from "../utils/channelUtils";

const useChatStore = create((set, get) => ({
  /* STATE */
  workspace: null,
  workspaces: [],
  channels: [],
  activeChannel: null,
  messages: [],
  userId: null,

  /* WORKSPACE */
  setWorkspace: (workspace) => set({ workspace }),

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [workspace, ...state.workspaces],
    })),

  /* USER */
  setUserId: (userId) => set({ userId }),

  /* CHANNELS */
  setChannels: (channels, userId = get().userId) =>
    set((state) => {
      const updated =
        typeof channels === "function"
          ? channels(state.channels)
          : channels;

      const enriched = userId
        ? updated.map((ch) => enrichChannel(ch, userId))
        : updated;

      return { channels: enriched };
    }),

  /* ACTIVE CHANNEL */
  setActiveChannel: (channel, userId = get().userId) => {
    if (!channel || !channel._id) {
      return set({ activeChannel: null, messages: [] });
    }

    const finalChannel = userId
      ? enrichChannel(channel, userId)
      : channel;

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

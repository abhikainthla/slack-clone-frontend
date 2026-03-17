import { create } from "zustand";

const useChatStore = create((set) => ({
  workspace: null,
  channels: [],
  activeChannel: null,
  messages: [],

  setWorkspace: (workspace) => set({ workspace }),

setChannels: (channels) =>
  set((state) => ({
    channels:
      typeof channels === "function"
        ? channels(state.channels)
        : channels,
  })),

  setActiveChannel: (channel) =>
    set({ activeChannel: channel, messages: [] }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
}));

export default useChatStore;

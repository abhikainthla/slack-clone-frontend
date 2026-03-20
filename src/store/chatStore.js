import { create } from "zustand";
import { enrichChannel } from "../utils/channelUtils";

const useChatStore = create((set, get) => ({
  // State
  workspace: null,
  workspaces: [],
  channels: [],
  activeChannel: null,
  messages: [],
  userId: null,

  // Workspace actions
  setWorkspace: (workspace) => set({ workspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [workspace, ...state.workspaces],
    })),

  // User actions
  setUserId: (userId) => set({ userId }),

  // Channel actions
  setChannels: (channels, userId = get().userId) =>
    set((state) => {
      const updated = typeof channels === "function" ? channels(state.channels) : channels;
      const enriched = userId ? updated.map((ch) => enrichChannel(ch, userId)) : updated;
      return { channels: enriched };
    }),

  setActiveChannel: (channel, userId = get().userId) => {
    if (!channel || !channel._id) {
      return set({ activeChannel: null, messages: [] });
    }
    const finalChannel = userId ? enrichChannel(channel, userId) : channel;
    set({
      activeChannel: finalChannel,
      messages: [],
    });
  },

  // Message actions
  setMessages: (messages) =>
  set((state) => ({
    messages:
      typeof messages === "function"
        ? messages(state.messages)
        : messages,
  })),
  
  addMessage: (message) =>
    set((state) => {
      // Prevent duplicates
      const exists = state.messages.find((m) => m._id === message._id);
      if (exists) return state;
      
      return {
        messages: [...state.messages, message],
      };
    }),

  clearMessages: () => set({ messages: [] }),

  updateMessage: (updatedMessage) =>
  set((state) => ({
    messages: state.messages.map((m) => {
      if (m._id !== updatedMessage._id) return m;

      return {
        ...m,
        ...updatedMessage,
        reactions: updatedMessage.reactions || m.reactions,
        bookmarkedBy: updatedMessage.bookmarkedBy || m.bookmarkedBy,
        sender: updatedMessage.sender || m.sender,
      };
    }),
  })),



  // Reaction actions (optimistic updates)
toggleReactionLocal: (messageId, emoji, userId) =>
  set((state) => ({
    messages: state.messages.map((m) => {
      if (m._id !== messageId) return m;

      let reactions = [...(m.reactions || [])];

      const index = reactions.findIndex((r) => r.user === userId);

      if (index !== -1) {
        if (reactions[index].emoji === emoji) {
          reactions.splice(index, 1);
        } else {
          reactions[index].emoji = emoji;
        }
      } else {
        reactions.push({ emoji, user: userId });
      }

      return { ...m, reactions };
    }),
  })),

toggleBookmarkLocal: (messageId, userId) =>
  set((state) => ({
    messages: state.messages.map((m) => {
      if (m._id !== messageId) return m;
      
      const bookmarkedBy = [...(m.bookmarkedBy || [])];
      const index = bookmarkedBy.findIndex(
        (id) => id.toString() === userId
      );

      if (index !== -1) {
        bookmarkedBy.splice(index, 1);
      } else {
        bookmarkedBy.push(userId);
      }

      return { ...m, bookmarkedBy };
    }),
  })),

  onlineUsers: {},

setUserStatus: (userId, status) =>
  set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [userId]: status,
    },
  })),



  // Additional useful actions
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId),
    })),

  setMessageEdited: (messageId, edited = true) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, edited } : m
      ),
    })),
}));

export default useChatStore;

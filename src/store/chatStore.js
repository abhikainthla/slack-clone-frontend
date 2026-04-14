import { create } from "zustand";
import { enrichChannel } from "../utils/channelUtils";
import socket from "../socket/socket";

const useChatStore = create((set, get) => ({
  // State
  workspace: null,
  workspaces: [],
  channels: [],
  activeChannel: null,
  messages: [],
  userId: null,
  unreadDMs: {},

dmUser: null,
isDM: false,

setDM: (user) => {
  socket.emit("join_dm", user._id);

  set((state) => ({
    isDM: true,
    dmUser: user,
    activeChannel: null,
    messages: [],
    unreadDMs: {
      ...state.unreadDMs,
      [user._id]: 0, // ✅ INSTANT CLEAR
    },
  }));
},


incrementUnread: (userId) =>
  set((state) => ({
    unreadDMs: {
      ...state.unreadDMs,
      [userId]: (state.unreadDMs[userId] || 0) + 1,
    },
  })),

clearUnread: (userId) =>
  set((state) => ({
    unreadDMs: {
      ...state.unreadDMs,
      [userId]: 0,
    },
  })),


clearDM: () =>
  set({
    isDM: false,
    dmUser: null,
  }),

  threadMessage: null,
threadReplies: [],

openThread: (message) =>
  set({
    threadMessage: message,
    threadReplies: [],
  }),

closeThread: () =>
  set({
    threadMessage: null,
    threadReplies: [],
  }),

  addThreadReply: (reply) =>
  set((state) => {
    const exists = state.threadReplies.some(
      (r) => r._id === reply._id
    );

    if (exists) return state;

    return {
      threadReplies: [...state.threadReplies, reply],
    };
  }),


setThreadReplies: (replies) =>
  set({ threadReplies: replies }),



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
    const updated =
      typeof channels === "function"
        ? channels([...state.channels])
        : channels;

    const enriched = userId
      ? updated.map((ch) => ({
          ...enrichChannel(ch, userId),


          unreadCount: ch.unreadCount || 0,
        }))
      : updated.map((ch) => ({
          ...ch,
          unreadCount: ch.unreadCount || 0,
        }));

    return { channels: [...enriched] };
  }),



  setActiveChannel: (channel, userId = get().userId) => {
      if (channel?._id) {
    socket.emit("join_channel", channel._id); // ✅ IMPORTANT
  }
    if (!channel || !channel._id) {
      return set({
        activeChannel: null,
        isDM: false,
        dmUser: null,
        messages: [],
      });
    }

    const finalChannel = userId ? enrichChannel(channel, userId) : channel;

    set((state) => ({
      channels: state.channels.map((ch) =>
        ch._id === channel._id
          ? { ...ch, unreadCount: 0 }
          : ch
      ),
    }));

    // ✅ 3. SET ACTIVE CHANNEL
    set({
      activeChannel: finalChannel,
      isDM: false,
      dmUser: null,
      messages: [],
    });

    // ✅ 4. CALL API (AFTER UI UPDATE)
    const lastMessageId = channel?.lastMessage?._id;

    if (lastMessageId) {
      import("../services/messageService").then(({ markChannelRead }) => {
        markChannelRead(channel._id, lastMessageId);
      });
    }
  },


  // Message actions
setMessages: (messages) =>
  set((state) => {
    const incoming =
      typeof messages === "function"
        ? messages(state.messages)
        : messages;

    const map = new Map();

    incoming.forEach((m) => {
    if (!m) return;

    const key = m._id || m.tempId;
    if (!key) return;

    map.set(key, {
      ...m,
      files: m.files || [], 
      sender: m.sender || null,
    });
  });


    return { messages: Array.from(map.values()) };
  }),

  
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
  set((state) => {
    const updateFn = (m) => {
      if (m._id !== updatedMessage._id) return m;

      return {
        ...m,
        ...updatedMessage,
        reactions: updatedMessage.reactions ?? m.reactions,
        bookmarkedBy: updatedMessage.bookmarkedBy ?? m.bookmarkedBy,
        pinned: updatedMessage.pinned ?? m.pinned,
        sender: updatedMessage.sender ?? m.sender,
      };
    };

    return {
      messages: state.messages.map(updateFn),
      threadReplies: state.threadReplies.map(updateFn),
    };
  }),




  // Reaction actions (optimistic updates)
toggleReactionLocal: (messageId, emoji, userId) =>
  set((state) => {
    const updateFn = (m) => {
      if (m._id !== messageId) return m;

      let reactions = [...(m.reactions || [])];

      const index = reactions.findIndex(
        (r) => r.user.toString() === userId.toString()
      );

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
    };

    return {
      messages: state.messages.map(updateFn),
      threadReplies: state.threadReplies.map(updateFn),
    };
  }),


toggleBookmarkLocal: (messageId, userId) =>
  set((state) => {
    const updateFn = (m) => {
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
    };

    return {
      messages: state.messages.map(updateFn),
      threadReplies: state.threadReplies.map(updateFn),
    };
  }),


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

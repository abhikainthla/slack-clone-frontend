import { create } from "zustand";
import socket from "../socket/socket";
import api from "../api/axios";
import { markChannelRead } from "../services/messageService";
const getStoredChannelUnread = () => {
  try {
    return JSON.parse(localStorage.getItem("channelUnread") || "{}");
  } catch {
    return {};
  }
};

const useChatStore = create((set, get) => ({
  // State
  workspace: null,
  workspaces: [],
  channels: [],
  activeChannel: null,
  messages: [],
  userId: null,
  pinnedDMs: JSON.parse(localStorage.getItem("pinnedDMs") || "[]"),
  blockedUsers: [],
  onlineUsers: {},
  notifications: [],
  notificationCount: 0,
  unreadDMs: JSON.parse(localStorage.getItem("unreadDMs") || "{}"),



dmUser: null,
isDM: false,

setDM: async (user) => {
  try {
    socket.emit("join_user", user._id);

    const res = await api.get(`/messages/conversations/${user._id}`);
    const conversationId = res.data._id;

    // ✅ FIXED: correct API
    await api.post(`/messages/read/dm/${user._id}`);

    if (conversationId) {
      await api.post(`/notifications/read/dm/${conversationId}`);
    }

    socket.emit("dm_read", { userId: user._id });


    set({
      isDM: true,
      dmUser: user,
      activeChannel: null,
      messages: [],
    });

    // ✅ clear unread locally
    useChatStore.getState().clearUnread(user._id);

  } catch (err) {
    console.error(err);
  }
},


incrementUnread: (userId) =>
  set((state) => {
    const updated = {
      ...state.unreadDMs,
      [userId]: (state.unreadDMs[userId] || 0) + 1,
    };

    localStorage.setItem("unreadDMs", JSON.stringify(updated));

    return { unreadDMs: updated };
  }),


clearUnread: (userId) =>
  set((state) => {
    const updated = {
      ...state.unreadDMs,
      [userId]: 0,
    };

    localStorage.setItem("unreadDMs", JSON.stringify(updated));

    return { unreadDMs: updated };
  }),



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


togglePinDM: (userId) =>
  set((state) => {
    const exists = state.pinnedDMs.includes(userId);

    const updated = exists
      ? state.pinnedDMs.filter((id) => id !== userId)
      : [...state.pinnedDMs, userId];

    localStorage.setItem("pinnedDMs", JSON.stringify(updated)); // ✅ persist

    return { pinnedDMs: updated };
  }),

setBlockedUsers: (users) => set({ blockedUsers: users }),

addBlockedUser: (userId) =>
  set((state) => ({
    blockedUsers: [...new Set([...state.blockedUsers, userId])],
  })),

removeBlockedUser: (userId) =>
  set((state) => ({
    blockedUsers: state.blockedUsers.filter(id => id !== userId),
  })),


setOnlineUsersBulk: (usersMap) =>
  set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      ...usersMap,
    },
  })),


  setNotificationCount: (count) => set({ notificationCount: count }),
  
  setUnreadDMs: (dms) => {
    localStorage.setItem("unreadDMs", JSON.stringify(dms));
    set({ unreadDMs: dms });
  },


setNotifications: (notifications) =>
  set({
    notifications,
    notificationCount: notifications.filter((n) => !n.read).length,
  }),


  


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
setChannels: (channels) =>
  set((state) => {
    const stored = getStoredChannelUnread();

    const updatedChannels =
      typeof channels === "function"
        ? channels(state.channels)
        : channels;

    return {
      channels: updatedChannels.map((ch) => {
        const existing = state.channels.find(c => c._id === ch._id);

        return {
          ...ch,
          unreadCount:
            ch.unreadCount ??
            existing?.unreadCount ??
            stored[ch._id] ??
            0,
        };
      }),
    };
  }),








setActiveChannel: async (channel) => {
  try {
    if (!channel?._id) {
      return set({
        activeChannel: null,
        messages: [],
      });
    }


    if (channel?.lastMessage?._id) {
      await markChannelRead(channel._id, channel.lastMessage._id);
          const res = await api.get("/notifications");
    useChatStore.getState().setNotifications(res.data.notifications);
    }


    socket.emit("channel_read", {
      channelId: channel._id,
    });

    socket.emit("join_channel", channel._id);

    set((state) => {
  const updatedChannels = state.channels.map((ch) =>
    ch._id === channel._id
      ? { ...ch, unreadCount: 0 }
      : ch
  );

  //  persist
  const map = {};
  updatedChannels.forEach(c => {
    map[c._id] = c.unreadCount || 0;
  });
  localStorage.setItem("channelUnread", JSON.stringify(map));

  return {
    channels: updatedChannels,
    activeChannel: channel,
    isDM: false,
    dmUser: null,
    messages: [],
  };
});


    //  sync notifications locally
    const store = useChatStore.getState();
    store.setNotifications(
      store.notifications.map((n) =>
        n.channel === channel._id ? { ...n, read: true } : n
      )
    );

  } catch (err) {
    console.error("CHANNEL READ ERROR:", err);
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
    const exists = state.messages.some(
      (m) =>
        m._id === message._id ||
        (message.clientId && m.clientId === message.clientId)
    );

    if (exists) return state; // ✅ prevent duplicate

    return {
      messages: [...state.messages, message],
    };
  }),



  clearMessages: () => set({ messages: [] }),

updateMessage: (updatedMessage) =>
  set((state) => {
    const updateFn = (m) => {
      // ✅ match real OR temp
      if (
        m._id === updatedMessage._id ||
        m._id === updatedMessage.clientId
      ) {
        return {
          ...m,
          ...updatedMessage,
          pending: false,
        };
      }

      return m;
    };

    return {
      messages: state.messages.map(updateFn),
      threadReplies: state.threadReplies.map(updateFn),
    };
  }),
deleteMessage: (messageId) =>
  set((state) => ({
    messages: state.messages.filter((m) => 
      m._id !== messageId && m.clientId !== messageId
    ),
  })),




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




setUserStatus: (userId, status, lastSeen) =>
  set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [userId]: {
        status,
        lastSeen,
      },
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

import socket from "./socket";
import api from "../api/axios";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import { getWorkspaceChannels } from "../services/channelService";
import { markChannelRead } from "../services/messageService";

export const initSocketListeners = () => {
  const store = useChatStore.getState;
  const auth = useAuthStore.getState;

  const getUser = () => auth().user;

  /* ================= PRESENCE ================= */
  socket.on("presence_update", ({ userId, status, lastSeen }) => {
    if (userId) store().setUserStatus(userId, status, lastSeen);
  });

  socket.on("online_users_list", (users) => {
    const map = {};
    if (Array.isArray(users)) {
      users.forEach((id) => {
        if (id) map[id.toString()] = { status: "online", lastSeen: null };
      });
    }
    store().setOnlineUsersBulk(map);
  });

  socket.on("connect", () => {
    const user = getUser();
    if (user?._id) socket.emit("user_online", user._id);
  });

  /* ================= MESSAGES ================= */
  socket.on("message_updated", (msg) => {
    store().updateMessage(msg);
  });

socket.on("receive_message", (msg) => {
  const s = store();
  const active = s.activeChannel;

  if (active?._id === msg.channel) {
    s.addMessage(msg);

    //  mark read instantly
    markChannelRead(msg.channel, msg._id);

  } else {
    s.setChannels((chs) =>
      chs.map((c) =>
        c._id === msg.channel
          ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
          : c
      )
    );
  }
});



  /* ================= REACTIONS / PIN / BOOKMARK ================= */
  socket.on("reaction_update", ({ messageId, reactions }) => {
    store().updateMessage({ _id: messageId, reactions });
  });

  socket.on("pin_update", ({ messageId, pinned }) => {
    store().updateMessage({ _id: messageId, pinned });
  });

  socket.on("bookmark_update", ({ messageId, bookmarkedBy }) => {
    store().updateMessage({ _id: messageId, bookmarkedBy });
  });

  /* ================= WORKSPACE ================= */
  socket.on("workspace_updated", (ws) => {
    store().setWorkspace(ws);
  });

  socket.on("workspace_role_updated", ({ workspaceId, userId, role }) => {
    const ws = store().workspace;
    if (!ws || ws._id !== workspaceId) return;

    store().setWorkspace({
      ...ws,
      members: ws.members.map((m) =>
        m.user._id === userId ? { ...m, role } : m
      ),
    });

    store().setChannels((chs) =>
      chs.map((ch) => ({
        ...ch,
        members: ch.members?.map((m) =>
          m._id === userId ? { ...m, role } : m
        ),
      }))
    );
  });

  socket.on("workspace_member_removed", ({ workspaceId, userId }) => {
    store().setWorkspace((ws) => {
      if (!ws || ws._id !== workspaceId) return ws;

      return {
        ...ws,
        members: ws.members.filter((m) => m.user._id !== userId),
      };
    });
  });

  socket.on("workspace_member_added", ({ workspaceId, user, role }) => {
    store().setWorkspace((ws) => {
      if (!ws || ws._id !== workspaceId) return ws;

      return {
        ...ws,
        members: [...ws.members, { user, role }],
      };
    });
  });

  socket.on("workspace_deleted", ({ workspaceId }) => {
    const s = store();
    if (s.workspace?._id === workspaceId) {
      s.setWorkspace(null);
      s.setChannels([]);
      window.location.href = "/workspace";
    }
  });

  socket.on("removed_from_workspace", ({ workspaceId }) => {
    const s = store();
    if (s.workspace?._id === workspaceId) {
      s.setWorkspace(null);
      s.setChannels([]);
      alert("You were removed from workspace");
      window.location.href = "/workspace";
    }
  });

  /* ================= CHANNELS ================= */
  socket.on("channel_updated", ({ channelId, updates }) => {
    store().setChannels((chs) =>
      chs.map((ch) =>
        ch._id === channelId ? { ...ch, ...updates } : ch
      )
    );

    const active = store().activeChannel;
    if (active?._id === channelId) {
      store().setActiveChannel({ ...active, ...updates });
    }
  });

  socket.on("channel_created", (channel) => {
    const s = store();
    const user = getUser();
    const ws = s.workspace;

    const role =
      ws?.members?.find((m) => m.user._id === user?._id)?.role ||
      "member";

    s.setChannels((chs) => {
      if (chs.some((c) => c._id === channel._id)) return chs;

      return [...chs, { ...channel, role, unreadCount: 0 }];
    });
  });

  socket.on("channel_deleted", ({ channelId }) => {
    store().setChannels((chs) =>
      chs.filter((ch) => ch._id !== channelId)
    );
  });

  socket.on("channel_members_updated", ({ channelId, add, remove }) => {
    const s = store();
    const user = getUser();

    s.setChannels((chs) => {
      const isAdded = add.some((id) => id === user?._id);

      if (isAdded) {
        if (chs.find((c) => c._id === channelId)) return chs;

        getWorkspaceChannels(s.workspace._id).then((res) => {
          s.setChannels(res.data);
        });

        return chs;
      }

      const isRemoved = remove.some((id) => id === user?._id);

      if (isRemoved) {
        return chs.filter((c) => c._id !== channelId);
      }

      return chs;
    });
  });

  /* ================= DM ================= */
socket.on("receive_dm", (message) => {
  const s = store();
  const { dmUser, isDM } = s;

  const senderId =
    typeof message.sender === "object"
      ? message.sender._id
      : message.sender;

  //  IF CURRENT CHAT OPEN → ADD MESSAGE + MARK READ
  if (isDM && dmUser?._id === senderId) {
    s.addMessage(message);

    api.post(`/messages/read/dm/${senderId}`);
    return;
  }

  //  otherwise unread
  const otherUserId =
  senderId === getUser()?._id
    ? message.conversation?.members?.find(id => id !== senderId)
    : senderId;

if (otherUserId) {
  s.incrementUnread(otherUserId);
}

});


socket.on("dm_read_update", ({ userId }) => {
  const s = store();
  s.setUnreadDMs({
    ...s.unreadDMs,
    [userId]: 0,
  });
});



  /* ================= NOTIFICATIONS ================= */
socket.on("new_notification", (n) => {
  const s = store();

  // ✅ update notifications
  s.setNotifications([
    {
      _id: n._id,
      type: n.type,
      message: n.message,
      channel: n.channel,
      conversation: n.conversation,
      read: false,
      createdAt: n.createdAt,
    },
    ...s.notifications,
  ]);

  // ✅ sync channel unread
  if (n.channel) {
    s.setChannels((chs) =>
      chs.map((c) =>
        c._id === n.channel
          ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
          : c
      )
    );
  }

  // ✅ sync DM unread
  if (n.conversation) {
    const currentUser = getUser()?._id;

    const otherUser = n.conversation.members?.find(
      (id) => id !== currentUser
    );

    if (otherUser) {
      s.incrementUnread(otherUser);
    }
  }
});

;

  socket.on("notifications_read", async ({ channelId, userId }) => {
    const user = getUser();
    if (userId !== user?._id) return;

    await api.post(`/notifications/read/channel/${channelId}`);


    const res = await api.get("/notifications");
    store().setNotifications(res.data.notifications);

    store().setChannels((chs) =>
      chs.map((c) =>
        c._id === channelId ? { ...c, unreadCount: 0 } : c
      )
    );
  });

  /* ================= CLEANUP ================= */
  return () => {
    socket.removeAllListeners();
  };
};
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






  /* ================= MESSAGES ================= */
  socket.on("message_updated", (msg) => {
    store().updateMessage(msg);
  });

socket.on("receive_message", (msg) => {
  const s = store();
  const active = s.activeChannel;

  if (!msg.channel) return;

  s.setChannels((chs) => {
    const updated = chs.map((c) => {
      if (c._id !== msg.channel) return c;

      let unread = c.unreadCount || 0;

      if (active?._id !== msg.channel) {
        unread += 1;
      } else {
        unread = 0;
      }

      return {
        ...c,
        lastMessage: msg,
        unreadCount: unread,
      };
    });

    // ✅ persist
    const map = {};
    updated.forEach(c => {
      map[c._id] = c.unreadCount || 0;
    });
    localStorage.setItem("channelUnread", JSON.stringify(map));

    return updated;
  });

  if (active?._id === msg.channel) {
    s.addMessage(msg);
    markChannelRead(msg.channel, msg._id);
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

    if (senderId) {
      api.post(`/messages/read/dm/${senderId}`);
    }

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
socket.on("new_notification", (notifications) => {
  const s = store();

  const normalized = Array.isArray(notifications)
    ? notifications
    : [notifications];

  const map = new Map();

  [...s.notifications, ...normalized].forEach(n => {
    map.set(n._id, n);
  });


  s.setNotifications(Array.from(map.values()));


});



;

socket.on("notifications_read", ({ channelId, userId }) => {
  const user = getUser();
  if (userId !== user?._id) return;

  const s = store();

  s.setNotifications(
    s.notifications.map(n =>
      n.channel === channelId ? { ...n, read: true } : n
    )
  );

  s.setChannels((chs) =>
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
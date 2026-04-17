import { BrowserRouter, Routes, Route } from "react-router-dom";
import api from "./api/axios";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";
import MainLayout from "./components/layout/MainLayout";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import Logout from "./pages/Logout";
import JoinWorkspace from "./pages/JoinWorkspace";
import useChatStore from "./store/chatStore";
import socket from "./socket/socket";
import { Toaster } from "react-hot-toast";
import UserSetup from "./pages/UserSetup";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";

function App() {
  const hydrateUser = useAuthStore((s) => s.hydrateUser);

  useEffect(() => {
    hydrateUser();
  }, []);

  /*  Emit online when user loads */
  const user = useAuthStore((s) => s.user);
useEffect(() => {
  if (!user?._id) return;

  socket.emit("user_online", user._id);
}, [user]);


  /*  HANDLE RECONNECT */
  useEffect(() => {
    const handleConnect = () => {
      if (user?._id) {
        socket.emit("user_online", user._id);
      }
    };

    socket.on("connect", handleConnect);

    return () => socket.off("connect", handleConnect);
  }, []);

  /*  Presence updates */
const setUserStatus = useChatStore((s) => s.setUserStatus);

useEffect(() => {
  const handler = ({ userId, status, lastSeen }) => {
    if (userId) setUserStatus(userId, status, lastSeen);
  };

  socket.on("presence_update", handler);
  return () => socket.off("presence_update", handler);
}, [setUserStatus]);


useEffect(() => {
  const fetchPresence = () => {
    socket.emit("get_online_users");
  };

socket.on("online_users_list", (users) => {
  const newState = {};
  if (Array.isArray(users)) {
    users.forEach((id) => {
      if (id) newState[id.toString()] = { status: "online", lastSeen: null };
    });
  }
  useChatStore.getState().setOnlineUsersBulk(newState);
  console.log("ONLINE USERS:", users);
});

  // If socket is already connected when component mounts, fetch immediately
  if (socket.connected) fetchPresence();
  socket.on("connect", fetchPresence);

  return () => {
    socket.off("online_users_list");
    socket.off("connect", fetchPresence);
  };
}, []);

useEffect(() => {
  const handleUpdate = (msg) => {
    useChatStore.getState().updateMessage(msg);
  };

  socket.on("message_updated", handleUpdate);

  return () => socket.off("message_updated", handleUpdate);
}, []);

// Pin updates
useEffect(() => {
  const handlePinUpdate = (data) => {
    useChatStore.getState().updateMessage({
      _id: data.messageId,
      pinned: data.pinned
    });
  };

  socket.on("pin_update", handlePinUpdate);
  return () => socket.off("pin_update", handlePinUpdate);
}, []);

// Bookmark updates  
useEffect(() => {
  const handleBookmarkUpdate = (data) => {
    useChatStore.getState().updateMessage({
      _id: data.messageId,
      bookmarkedBy: data.bookmarkedBy
    });
  };

  socket.on("bookmark_update", handleBookmarkUpdate);
  return () => socket.off("bookmark_update", handleBookmarkUpdate);
}, []);

// Reaction updates (already exists, but make consistent)
useEffect(() => {
  const handleReactionUpdate = (data) => {
    useChatStore.getState().updateMessage({
      _id: data.messageId,
      reactions: data.reactions
    });
  };

  socket.on("reaction_update", handleReactionUpdate);
  return () => socket.off("reaction_update", handleReactionUpdate);
}, []);


useEffect(() => {
  const handler = ({ workspaceId, userId, role }) => {
    useChatStore.getState().setWorkspace((ws) => {
      if (!ws || ws._id !== workspaceId) return ws;

      return {
        ...ws,
        members: ws.members.map((m) =>
          m.user._id === userId ? { ...m, role } : m
        ),
      };
    });
  };

  socket.on("workspace_role_updated", handler);
  return () => socket.off("workspace_role_updated", handler);
}, []);

useEffect(() => {
  const handler = ({ workspaceId, userId }) => {
    useChatStore.getState().setWorkspace((ws) => {
      if (!ws || ws._id !== workspaceId) return ws;

      return {
        ...ws,
        members: ws.members.filter(
          (m) => m.user._id !== userId
        ),
      };
    });
  };

  socket.on("workspace_member_removed", handler);
  return () => socket.off("workspace_member_removed", handler);
}, []);

useEffect(() => {
const handleChannelMessage = (msg) => {
  const store = useChatStore.getState();

  const exists = store.messages.some(
    (m) =>
      m._id === msg._id ||
      (msg.clientId && m.clientId === msg.clientId)
  );

  if (exists) return;

  store.addMessage(msg);
};


  socket.on("receive_message", handleChannelMessage);
  return () => socket.off("receive_message", handleChannelMessage);
}, []);

useEffect(() => {
  const handleChannelUpdate = ({ channelId, updates }) => {
    useChatStore.getState().setChannels((channels) =>
      channels.map((ch) =>
        ch._id === channelId ? { ...ch, ...updates } : ch
      )
    );
  };

  socket.on("channel_updated", handleChannelUpdate);

  return () => {
    socket.off("channel_updated", handleChannelUpdate);
  };
}, []);

// ROLE UPDATE
useEffect(() => {
  const handler = ({ channelId, userId, role }) => {
    useChatStore.getState().setChannels((channels) =>
      channels.map((ch) => {
        if (ch._id !== channelId) return ch;

        return {
          ...ch,
          members: ch.members?.map((m) =>
            m._id === userId ? { ...m, role } : m
          ),
        };
      })
    );
  };

  socket.on("channel_role_updated", ({ channelId, userId, role }) => {
  useChatStore.getState().setChannels((channels) =>
    channels.map((ch) => {
      if (ch._id !== channelId) return ch;

      return {
        ...ch,
        members: ch.members?.map((m) =>
          m._id === userId ? { ...m, role } : m
        ),
      };
    })
  );
});

}, []);

// MEMBER UPDATE
useEffect(() => {
  const handler = ({ channelId, add, remove }) => {
    useChatStore.getState().setChannels((channels) =>
      channels.map((ch) => {
        if (ch._id !== channelId) return ch;

        return {
          ...ch,
          members: [
            ...(ch.members || []).filter(
              (m) => !remove.includes(m._id)
            ),
            ...add.map((id) => ({ _id: id })),
          ],
        };
      })
    );
  };

  socket.on("channel_members_updated", ({ channelId, add, remove }) => {
  useChatStore.getState().setChannels((channels) =>
    channels.map((ch) => {
      if (ch._id !== channelId) return ch;

      let updatedMembers = [...(ch.members || [])];

      // ❌ remove
      updatedMembers = updatedMembers.filter(
        (m) => !remove.includes(m._id)
      );

      // ➕ add (avoid duplicates)
      add.forEach((id) => {
        if (!updatedMembers.some((m) => m._id === id)) {
          updatedMembers.push({ _id: id });
        }
      });

      return { ...ch, members: updatedMembers };
    })
  );
});

}, []);




useEffect(() => {
  const handleRead = ({ channelId, userId }) => {
    const store = useChatStore.getState();
    const currentUser = useAuthStore.getState().user;

    // ✅ Only update for yourself
    if (userId !== currentUser._id) return;

    store.setChannels((channels) =>
      channels.map((ch) =>
        ch._id === channelId
          ? { ...ch, unreadCount: 0 }
          : ch
      )
    );
  };

  socket.on("notifications_read", handleRead);

  return () => socket.off("notifications_read", handleRead);
}, []);

useEffect(() => {
  const handleBlocked = ({ blockedUsers }) => {
    useChatStore.getState().setBlockedUsers(blockedUsers);
  };

  const handleUnblocked = ({ blockedUsers }) => {
    useChatStore.getState().setBlockedUsers(blockedUsers);
  };

  socket.on("user_blocked", handleBlocked);
  socket.on("user_unblocked", handleUnblocked);

  return () => {
    socket.off("user_blocked", handleBlocked);
    socket.off("user_unblocked", handleUnblocked);
  };
}, []);

const setBlockedUsers = useChatStore((s) => s.setBlockedUsers);

useEffect(() => {
  const fetchBlocked = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/users/profile");

      setBlockedUsers(res.data.blockedUsers.map(u => u._id));
    } catch (err) {
      console.error("❌ Blocked users error:", err);
    }
  };

  if (user?._id) fetchBlocked();
}, [user]);




useEffect(() => {
  if (!user?._id) return;

  const handleDM = (msg) => {
    const store = useChatStore.getState();
    const { dmUser, isDM } = store;

    if (!msg?.sender) return;

    const senderId =
      typeof msg.sender === "object" ? msg.sender._id : msg.sender;

    if (senderId === user._id) return;

    if (
      isDM &&
      dmUser &&
      senderId === dmUser._id
    ) {
      store.addMessage(msg);
    }

    // unread
    if (senderId !== user._id && (!isDM || dmUser?._id !== senderId)) {
      store.incrementUnread(senderId);
    }
  };

  socket.on("receive_dm", handleDM);
  return () => socket.off("receive_dm", handleDM);
}, [user]);



useEffect(() => {
  if (user?._id) {
    socket.emit("join_user", user._id); 
  }
}, [user]);



  return (
    <BrowserRouter>
    <Toaster position="bottom-center" />
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />}/>
        <Route path="/logout" element={<Logout />} />
        <Route path="/usersetup" element={<UserSetup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile/:id" element={<UserProfile />} />

        {/* Workspace selection */}
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/join/:token" element={<JoinWorkspace />} />

        {/* Main App Layout */}
        <Route path="/workspace/:id" element={<MainLayout />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

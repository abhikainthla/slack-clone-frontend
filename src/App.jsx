import { BrowserRouter, Routes, Route } from "react-router-dom";

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

function App() {
  const hydrateUser = useAuthStore((s) => s.hydrateUser);

  useEffect(() => {
    hydrateUser();
  }, []);

  /*  Emit online when user loads */
  const user = useAuthStore.getState().user;
  useEffect(() => {

    if (user?._id) {
      socket.emit("user_online", user._id);
    }
  }, []);

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
  useEffect(() => {
    socket.on("presence_update", ({ userId, status }) => {
      useChatStore.getState().setUserStatus(userId, status);
    });

    return () => socket.off("presence_update");
  }, []);

  useEffect(() => {
  socket.emit("get_online_users");

  socket.on("online_users_list", (users) => {
    const store = useChatStore.getState();

    users.forEach((id) => {
      store.setUserStatus(id, "online");
    });
  });

  return () => socket.off("online_users_list");
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
  const handleChannelMessage = (msg) => {
    const store = useChatStore.getState();
    const { activeChannel } = store;
    const currentUser = useAuthStore.getState().user;

    // ❌ ignore own messages
    if (msg.sender?._id === currentUser?._id) return;

    if (activeChannel?._id !== msg.channel) {
  store.setChannels((channels) =>
    channels.map((ch) =>
      ch._id === msg.channel
        ? {
            ...ch,
            unreadCount: (ch.unreadCount || 0) + 1,
          }
        : ch
    )
  );
}

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
  const handleDM = (msg) => {
    const store = useChatStore.getState();
    const { dmUser, isDM } = store;

    // ✅ If currently chatting with same user → add message
    if (
      isDM &&
      dmUser &&
      (msg.sender._id === dmUser._id ||
        msg.sender._id === user._id)

    ) {
      store.addMessage(msg);
    }

    // ✅ Always update unread count
    if (msg.sender._id !== user._id) {
  if (!isDM || dmUser?._id !== msg.sender._id) {
    store.incrementUnread(msg.sender._id);
  }
}

  };

  socket.on("receive_dm", handleDM);

  return () => socket.off("receive_dm", handleDM);
}, []);

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

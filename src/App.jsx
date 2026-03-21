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

function App() {
  const hydrateUser = useAuthStore((s) => s.hydrateUser);

  useEffect(() => {
    hydrateUser();
  }, []);

  /*  Emit online when user loads */
  useEffect(() => {
    const user = useAuthStore.getState().user;

    if (user?._id) {
      socket.emit("user_online", user._id);
    }
  }, []);

  /*  HANDLE RECONNECT */
  useEffect(() => {
    const handleConnect = () => {
      const user = useAuthStore.getState().user;

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


  return (
    <BrowserRouter>
    <Toaster position="bottom-center" />
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />}/>
        <Route path="/logout" element={<Logout />} />

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

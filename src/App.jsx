import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";
import useChatStore from "./store/chatStore";
import { initSocketListeners } from "./socket/listeners";
import socket from "./socket/socket";

import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import UserSetup from "./pages/UserSetup";
import MainLayout from "./components/layout/MainLayout";
import JoinWorkspace from "./pages/JoinWorkspace";
import WorkspaceInfo from "./pages/WorkspaceInfo"

function App() {
  const user = useAuthStore((s) => s.user);
  const hydrateUser = useAuthStore((s) => s.hydrateUser);
  const workspace = useChatStore((s) => s.workspace);

  useEffect(() => {
    hydrateUser();
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    socket.emit("user_online", user._id);
    socket.emit("join_user", user._id);

    initSocketListeners(); // 🔥 ALL SOCKET LOGIC HERE
  }, [user?._id]);

  useEffect(() => {
    if (!workspace?._id) return;

    socket.emit("join_workspace", workspace._id);

    return () => {
      socket.emit("leave_workspace", workspace._id);
    };
  }, [workspace?._id]);

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
        <Route path="/workspace/:id/info" element={<WorkspaceInfo />} />


        {/* Main App Layout */}
        <Route path="/workspace/:id" element={<MainLayout />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

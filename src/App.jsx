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
import api from "./api/axios";
import LandingPage from "./pages/LandingPage";
import CheckEmail from "./pages/CheckEmail";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

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

    initSocketListeners(); 
  }, [user?._id]);
  

  useEffect(() => {
    if (!workspace?._id) return;

    socket.emit("join_workspace", workspace._id);

    return () => {
      socket.emit("leave_workspace", workspace._id);
    };
  }, [workspace?._id]);

  useEffect(() => {
  const storedChannels = JSON.parse(localStorage.getItem("channelUnread") || "{}");
  const storedDMs = JSON.parse(localStorage.getItem("unreadDMs") || "{}");

  useChatStore.setState({
    unreadDMs: storedDMs,
  });

  useChatStore.setState((state) => ({
    channels: state.channels.map((ch) => ({
      ...ch,
      unreadCount: storedChannels[ch._id] || 0,
    })),
  }));
}, []);


    useEffect(() => {
  if (!user?._id) return;

  const interval = setInterval(() => {
    socket.emit("heartbeat", user._id);
  }, 30000); // every 30 sec

  return () => clearInterval(interval);
}, [user?._id]);

useEffect(() => {
  if (!user?._id) return;

  const initNotifications = async () => {
    try {
      const res = await api.get("/notifications");

      const notifications = res.data.notifications || [];

      const store = useChatStore.getState();

      //  ONLY set notifications
      store.setNotifications(notifications);

      //  DO NOT calculate unread counts here
      // unread counts are handled by sockets (receive_message / receive_dm)

    } catch (err) {
      console.error("INIT NOTIFICATIONS ERROR", err);
    }
  };

  initNotifications();
}, [user?._id]);


const channels = useChatStore((s) => s.channels);

useEffect(() => {
  channels.forEach((ch) => {
    socket.emit("join_channel", ch._id);
  });
}, [channels]);





  return (
    <BrowserRouter>
    <Toaster position="bottom-center" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />}/>
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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

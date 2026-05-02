import { useEffect, useState } from "react";
import { getWorkspaces } from "../services/workspaceService";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import CreateWorkspaceModal from "../components/modals/CreateWorkspaceModal";
import { LogOut } from "lucide-react";
import socket from "../socket/socket";

export default function Workspace() {
  const [workspaces, setWorkspaces] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchNotifications();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await getWorkspaces();
      setWorkspaces(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    socket.on("new_notification", (data) => {
      const userId = user?._id;

      const newOnes = data.notifications.filter(
        (n) => n.user?.toString() === userId?.toString()
      );

      if (newOnes.length === 0) return;

      setNotifications((prev) => [...newOnes, ...prev]);
    });

    return () => socket.off("new_notification");
  }, [user]);

  const getWorkspaceNotificationCount = (workspaceId) => {
    return notifications.filter(
      (n) =>
        n?.message?.workspace?.toString() === workspaceId?.toString()
    ).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-8 lg:px-20 py-4 border-b bg-white gap-4">
        <h1 className="text-lg sm:text-xl font-semibold">
          Your Workspaces
        </h1>

        <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto justify-between sm:justify-end">

          {/* USER */}
          <div
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-100 px-2 sm:px-3 py-1 rounded-lg transition"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-500 text-white flex items-center justify-center font-semibold text-xs sm:text-sm">
                {getInitials(user?.name)}
              </div>
            )}

            {/* hide email on small screens */}
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-red-700 hover:bg-red-100 transition"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="py-6 sm:py-8 px-4 sm:px-8 lg:px-20">

        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <p className="text-gray-500 text-sm sm:text-base">
            WORKSPACES ({workspaces.length})
          </p>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            + New Workspace
          </button>
        </div>

        {/* GRID */}
        <div className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          lg:grid-cols-3 
          gap-4 sm:gap-6
        ">
          {workspaces.map((ws) => {
            const notificationCount =
              getWorkspaceNotificationCount(ws._id);

            return (
              <div
                key={ws._id}
                onClick={() => {
                  setNotifications((prev) =>
                    prev.filter(
                      (n) =>
                        n?.message?.workspace?.toString() !==
                        ws._id.toString()
                    )
                  );

                  navigate(`/workspace/${ws._id}`);
                }}
                className="p-4 sm:p-5 bg-white rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition"
              >
                {/* HEADER */}
                <div className="flex items-center gap-3 mb-3">

                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${ws.color || "bg-purple-500"}`}
                  >
                    {getInitials(ws.name)}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-sm sm:text-md font-semibold leading-tight">
                      {ws.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {ws.members?.length || 0} members
                    </p>
                  </div>

                  {/* NOTIFICATION BADGE */}
                  {notificationCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </div>

                {/* DESCRIPTION */}
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                  {ws.description || "No description"}
                </p>
              </div>
            );
          })}
        </div>

        {workspaces.length === 0 && (
          <p className="text-gray-400 mt-10 text-center">
            No workspaces yet
          </p>
        )}
      </div>

      <CreateWorkspaceModal
        open={showModal}
        onOpenChange={setShowModal}
        onCreated={(newWorkspace) => {
          setWorkspaces((prev) => [newWorkspace, ...prev]);
        }}
      />
    </div>
  );
}


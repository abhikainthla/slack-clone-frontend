import { useEffect, useState } from "react";
import { getWorkspaces } from "../services/workspaceService";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import CreateWorkspaceModal from "../components/modals/CreateWorkspaceModal";
import { LogOut } from "lucide-react";

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
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  //  count notifications per workspace
  const getWorkspaceNotificationCount = (workspaceId) => {
    return notifications.filter(
      (n) => n?.message?.workspace === workspaceId
    ).length;
  };

  return (
    <div className="h-screen bg-gray-50">

      {/* HEADER */}
      <div className="flex justify-between items-center px-20 py-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Your Workspaces</h1>

        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-600">
            {user?.email}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="
              flex items-center gap-2 
              px-4 py-2 
              rounded-md 
              text-sm font-medium 
              text-red-700 
              border border-red-500
              hover:bg-red-300 border-none
              focus:outline-none focus:ring-2 focus:ring-red-300
              transition-colors
            "
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="py-8 px-20">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500">
            WORKSPACES ({workspaces.length})
          </p>
           <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            + New Workspace
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-3 gap-6">
          {workspaces.map((ws) => {
            const memberCount = ws.members?.length || 0;
            const notificationCount =
              getWorkspaceNotificationCount(ws._id);

            return (
              <div
                key={ws._id}
                onClick={() => navigate(`/workspace/${ws._id}`)}
                className="p-5 bg-white rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition"
              >
                {/* HEADER */}
                <div className="flex items-center gap-3 mb-3">

                  {/* AVATAR */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${ws.color || "bg-purple-500"}`}
                  >
                    {getInitials(ws.name)}
                  </div>

                  <div>
                    <h2 className="text-md font-semibold leading-tight">
                      {ws.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {ws.members?.length || 0} members
                    </p>
                  </div>

                </div>

                {/* DESCRIPTION */}
                <p className="text-sm text-gray-500 line-clamp-2">
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

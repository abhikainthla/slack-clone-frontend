import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { getWorkspaces, createWorkspace } from "../../services/workspaceService";
import { useNavigate, useParams } from "react-router-dom";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import { LogOut, Plus } from "lucide-react";

export default function WorkspaceBar() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ FORM STATE
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const { id: activeWorkspaceId } = useParams();

  const setWorkspace = useChatStore((s) => s.setWorkspace);
  const user = useAuthStore((s) => s.user);

  const fetchWorkspaces = async () => {
    try {
      const res = await getWorkspaces();
      setWorkspaces(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // ✅ CREATE WORKSPACE
  const handleCreate = async () => {
    if (!name.trim()) return;

    setLoading(true);

    try {
      const res = await createWorkspace({ name: name.trim() });

      setWorkspaces((prev) => [...prev, res.data]);
      setName("");
      setOpen(false);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-16 bg-gray-200 flex flex-col items-center py-4 justify-between">

      {/* TOP */}
      <div className="flex flex-col items-center space-y-4">

        {/* WORKSPACES */}
        {workspaces.map((ws) => {
          const isActive = ws._id === activeWorkspaceId;

          return (
            <div
              key={ws._id}
              onClick={() => {
                setWorkspace(ws);
                navigate(`/workspace/${ws._id}`);
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold cursor-pointer transition ${
                isActive
                  ? "bg-purple-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {ws.name?.charAt(0).toUpperCase()}
            </div>
          );
        })}

        {/* ➕ POPOVER */}
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center text-xl cursor-pointer hover:bg-gray-400">
              <Plus />
            </div>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              side="right"
              align="center"
              className="bg-white p-4 rounded-xl shadow-lg w-48 border"
            >
              <p className="text-sm font-medium mb-2">
                New Workspace
              </p>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                className="w-full border px-2 py-1 rounded text-sm mb-3 outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />

              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className={`w-full py-1 rounded text-sm text-white ${
                  loading || !name.trim()
                    ? "bg-gray-400"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {loading ? "Creating..." : "Create"}
              </button>

              <Popover.Arrow className="fill-white" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

      </div>

      {/* BOTTOM */}
      <div className="flex flex-col items-center space-y-3">

        {/* USER */}
        <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        {/* LOGOUT */}
        <div
          onClick={() => {
            if (user) {
              navigate("/logout");
            } else {
              navigate("/login");
            }
          }}
          className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
        >
          <LogOut />
        </div>
      </div>
    </div>
  );
}

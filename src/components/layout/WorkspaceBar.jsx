import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { getWorkspaces, createWorkspace } from "../../services/workspaceService";
import { useNavigate, useParams } from "react-router-dom";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import { LogOut, Plus } from "lucide-react";

export default function WorkspaceBar() {
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("bg-purple-500");

  const colors = [
    "bg-indigo-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-teal-500",
  ];
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
              className="bg-white p-5 rounded-xl shadow-xl w-64 border"
            >

              <h3 className="text-sm font-semibold mb-3">
                Create Workspace
              </h3>

              {/* NAME */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">
                  Workspace Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Design Team"
                  className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">
                  Description
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Optional..."
                  className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  rows={2}
                />
              </div>

              {/* COLOR PICKER */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-2 block">
                  Color
                </label>

                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-md cursor-pointer ${c} ${
                        color === c ? "ring-2 ring-blue-600" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* ACTION */}
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className={`w-full py-2 rounded-lg text-sm text-white transition ${
                  loading || !name.trim()
                    ? "bg-gray-400"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {loading ? "Creating..." : "Create Workspace"}
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

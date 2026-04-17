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
  const [open, setOpen] = useState(false);

  // ✅ FORM STATE
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("bg-purple-500");

  const colors = [
    "bg-indigo-500", "bg-pink-500", "bg-yellow-500", "bg-green-500",
    "bg-blue-500", "bg-purple-500", "bg-red-500", "bg-teal-500",
  ];

  const navigate = useNavigate();
  const { id: activeWorkspaceId } = useParams();
  const setWorkspace = useChatStore((s) => s.setWorkspace);
  const user = useAuthStore((s) => s.user);

  const fetchWorkspaces = async () => {
    try {
      const res = await getWorkspaces();
      setWorkspaces(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      // ✅ Pass name, desc, and color to the service
      const res = await createWorkspace({ 
        name: name.trim(), 
        description: desc.trim(), 
        color: color 
      });

      setWorkspaces((prev) => [...prev, res.data]);
      setName("");
      setDesc("");
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-16 bg-gray-200 flex flex-col items-center py-4 justify-between h-screen relative z-[100] border-r border-gray-300">
      
      {/* TOP SECTION */}
      <div className="flex flex-col items-center space-y-4 w-full">
        
        {/* WORKSPACES LIST */}
        {workspaces.map((ws) => {
          const isActive = ws._id === activeWorkspaceId;
          // ✅ Use the color from the database, or fallback to purple
          const wsColor = ws.color || "bg-purple-600"; 

          return (
            <div
              key={ws._id}
              title={ws.name} // Simple tooltip
              onClick={() => {
                setWorkspace(ws);
                navigate(`/workspace/${ws._id}`);
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold cursor-pointer transition-all duration-200 shadow-sm ${
                isActive
                  ? `${wsColor} text-white ring-2 ring-offset-2 ring-gray-400 scale-110`
                  : "bg-gray-300 text-gray-600 hover:bg-gray-400 hover:rounded-xl"
              }`}
            >
              {ws.name?.charAt(0).toUpperCase()}
            </div>
          );
        })}

        {/* ➕ ADD WORKSPACE POPOVER */}
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <div className="w-10 h-10 rounded-lg bg-white border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 cursor-pointer hover:border-purple-500 hover:text-purple-500 transition-all">
              <Plus size={20} />
            </div>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              side="right"
              align="start"
              sideOffset={12}
              className="bg-white p-5 rounded-2xl shadow-2xl w-72 border border-gray-100 animate-in fade-in zoom-in duration-150"
            >
              <h3 className="text-sm font-bold text-gray-700 mb-4">Create Workspace</h3>

              <div className="space-y-3">
                {/* NAME */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Design Team"
                    className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Optional..."
                    className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                    rows={2}
                  />
                </div>

                {/* COLOR PICKER */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Workspace Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => (
                      <div
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${c} ${
                          color === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={loading || !name.trim()}
                  className={`w-full py-2.5 mt-2 rounded-lg text-sm font-semibold text-white transition-all shadow-md ${
                    loading || !name.trim()
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 active:scale-95"
                  }`}
                >
                  {loading ? "Creating..." : "Create Workspace"}
                </button>
              </div>

              <Popover.Arrow className="fill-white" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {/* BOTTOM SECTION */}
      <div className="flex flex-col items-center space-y-4">
        {/* USER SETTINGS */}
        <div
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-purple-500 cursor-pointer transition-all shadow-sm"
        >
          <img
            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
            className="w-full h-full object-cover"
            alt="User Avatar"
          />
        </div>

        {/* LOGOUT */}
        <button
          onClick={() => navigate(user ? "/logout" : "/login")}
          className="w-10 h-10 rounded-lg text-gray-500 flex items-center justify-center cursor-pointer hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
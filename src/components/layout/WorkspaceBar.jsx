import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { getWorkspaces, createWorkspace } from "../../services/workspaceService";
import { useNavigate, useParams } from "react-router-dom";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import { LogOut, Plus, Settings } from "lucide-react";

export default function WorkspaceBar({ isMobile = false }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
    <div
      className={`
        ${isMobile 
          ? "flex w-full h-14 px-2 border-b overflow-hidden" 
          : "hidden lg:flex w-[68px] h-screen flex-col border-r py-4"}
        bg-[#1e1540] items-center justify-between relative z-[100] border-white/10
      `}
    >

      {/* SECTION: WORKSPACES */}
      <div
        className={`
          ${isMobile 
            ? "flex items-center gap-3 overflow-x-auto no-scrollbar w-full" 
            : "flex flex-col items-center space-y-4 w-full"}
        `}
      >


        
        {workspaces.map((ws) => {
          const isActive = ws._id === activeWorkspaceId;
          const wsColor = ws.color || "bg-purple-600";

          return (
            <div
              key={ws._id}
              title={ws.name}
              onClick={() => {
                setWorkspace(ws);
                navigate(`/workspace/${ws._id}`);
              }}
              className={`
                shrink-0 min-w-[40px] h-10 rounded-xl flex items-center justify-center font-bold
                cursor-pointer transition-all duration-200
                ${isActive
                  ? `${wsColor} text-white ring-2 ring-white ring-offset-2 ring-offset-[#1e1540]`
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
                }
              `}

            >
              {ws.name?.charAt(0).toUpperCase()}
            </div>
          );
        })}

        {/* ADD WORKSPACE */}
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button className="shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-dashed border-white/30 flex items-center justify-center text-white/50 hover:border-white hover:text-white transition-all">
              <Plus size={20} />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              side={isMobile ? "bottom" : "right"}
              align="center"
              sideOffset={10}
              className="bg-white p-4 rounded-xl shadow-2xl w-[90vw] max-w-[320px] border border-gray-100 z-[110]"
            >

              <h3 className="text-sm font-bold text-gray-700 mb-4">New Workspace</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => (
                      <div
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full cursor-pointer border-2 ${color === c ? "border-gray-400 scale-110" : "border-transparent"} ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={loading || !name.trim()}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {/* SECTION: USER / BOTTOM */}
      <div className={`
        ${isMobile 
          ? "flex items-center ml-3 pl-3 border-l border-white/10 gap-2 shrink-0" 
          : "flex flex-col items-center space-y-4"}
      `}>
        <div
          onClick={() => navigate("/settings")}
          className="w-8 h-8 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:border-white transition-all"
        >
          <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="avatar" />
        </div>
        {!isMobile && (
          <button 
            onClick={() => navigate("/logout")}
            className="text-white/40 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Users, Settings, Link2, Trash2, Hash, Copy, Check, ChevronLeft } from "lucide-react";
import { getWorkspaceChannels } from "../services/channelService";

export default function WorkspaceInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wsRes, membersRes, channelsRes] = await Promise.all([
          api.get(`/workspaces/${id}`),
          api.get(`/workspaces/${id}/members`),
          getWorkspaceChannels(id),
        ]);
        setWorkspace(wsRes.data);
        setMembers(membersRes.data);
        setChannels(channelsRes.data);
      } catch (err) {
        console.error("Error loading workspace:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading workspace...</div>;
  if (!workspace) return <div className="p-8 text-center text-red-500">Workspace not found</div>;

  return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 min-h-screen">
      
      {/* BACK BUTTON */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-purple-600"
      >
        <ChevronLeft size={18} /> Back
      </button>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border p-4 md:p-6 rounded-2xl shadow-sm">
        
        {/* LEFT */}
        <div className="flex items-start gap-4">
          <div 
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${workspace?.color || "bg-purple-500"}`}
          >
            {workspace.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">
              {workspace.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">
              {workspace.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* RIGHT BUTTONS */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={async () => { 
              const res = await api.post(`/workspaces/${id}/invite-link`); 
              setInviteLink(res.data.inviteLink); 
            }} 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm"
          >
            <Link2 size={16} /> Invite
          </button>

          {workspace.role === "admin" && (
            <button className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-xs sm:text-sm">
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* INVITE SECTION */}
      {inviteLink && (
        <div className="bg-purple-50 border p-4 rounded-xl">
          <label className="text-xs font-bold text-purple-600 uppercase">
            Invite Link
          </label>

          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <input 
              value={inviteLink} 
              readOnly 
              className="flex-1 bg-white border p-2 rounded-lg text-xs sm:text-sm font-mono truncate"
            />

            <button 
              onClick={handleCopy} 
              className="bg-purple-600 text-white p-2 rounded-lg"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* MEMBERS */}
        <div className="bg-white border p-4 rounded-xl shadow-sm max-h-[400px] overflow-y-auto">
          <h2 className="flex items-center gap-2 font-semibold mb-4 text-sm sm:text-base">
            <Users size={18} /> Members ({members.length})
          </h2>

          <div className="space-y-2">
            {members.map((m) => (
              <div 
                key={m._id} 
                className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img 
                    src={m.avatar || `https://ui-avatars.com/api/?name=${m.name}`} 
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 bg-gray-200 rounded whitespace-nowrap">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CHANNELS */}
        <div className="bg-white border p-4 rounded-xl shadow-sm max-h-[400px] overflow-y-auto">
          <h2 className="flex items-center gap-2 font-semibold mb-4 text-sm sm:text-base">
            <Hash size={18} /> Channels ({channels.length})
          </h2>

          <div className="space-y-2">
            {channels.map((ch) => (
              <div 
                key={ch._id} 
                className="flex justify-between items-center p-2 sm:p-3 bg-slate-50 rounded-lg"
              >
                <span className="text-sm truncate flex items-center gap-1">
                  <Hash size={14} /> {ch.name}
                </span>

                {ch.isPrivate && (
                  <span className="text-[10px] px-2 py-0.5 bg-white border rounded whitespace-nowrap">
                    Private
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
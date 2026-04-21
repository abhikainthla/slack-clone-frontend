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
    <div className="max-w-4xl mx-auto p-6 space-y-8  min-h-screen">
      
      {/* BACK BUTTON */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors"
      >
        <ChevronLeft size={18} /> Back
      </button>

      {/* HEADER */}
        <div className="flex items-start justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-5">
            {/* FIXED ICON BACKGROUND */}
            <div 
           className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${workspace?.color || "bg-purple-500"}`}
            >
            {workspace.name.charAt(0).toUpperCase()}
            </div>
            
            <div>
            <h1 className="text-2xl font-bold text-slate-900">{workspace.name}</h1>
            <p className="text-slate-500 mt-1 max-w-md">{workspace.description || "No description provided."}</p>
            </div>
        </div>

        <div className="flex gap-2">
            <button 
            onClick={async () => { 
                const res = await api.post(`/workspaces/${id}/invite-link`); 
                setInviteLink(res.data.inviteLink); 
            }} 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white transition px-4 py-2 rounded-lg text-sm font-medium"
            >
            <Link2 size={16} /> Generate Invite
            </button>
            
            {workspace.role === "admin" && (
            <button className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 transition">
                <Trash2 size={16} /> Delete
            </button>
            )}
        </div>
        </div>

      {/* INVITE SECTION */}
      {inviteLink && (
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
          <label className="text-xs font-bold text-purple-600 uppercase tracking-wider">Invite Link</label>
          <div className="flex items-center gap-2 mt-2">
            <input value={inviteLink} readOnly className="w-full bg-white border border-purple-200 p-2.5 rounded-lg text-sm text-slate-700 font-mono shadow-sm" />
            <button onClick={handleCopy} className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-lg transition shadow-md">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MEMBERS */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 text-md font-semibold mb-4 text-slate-800">
            <Users size={18} className="text-slate-400" /> Members ({members.length})
          </h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m._id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <img src={m.avatar || `https://ui-avatars.com/api/?name=${m.name}`} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{m.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHANNELS */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 text-md font-semibold mb-4 text-slate-800">
            <Hash size={18} className="text-slate-400" /> Channels ({channels.length})
          </h2>
          <div className="space-y-2">
            {channels.map((ch) => (
              <div key={ch._id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2"><Hash size={14} className="text-slate-400" /> {ch.name}</span>
                {ch.isPrivate && <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 rounded bg-white">Private</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
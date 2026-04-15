import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { X, UserPlus, Shield, Trash2, Lock, Globe, Settings2 } from "lucide-react";
import {
  updateChannelSettings,
  updateChannelMembers,
  updateChannelRole,
  getChannelMembers,
  deleteChannel,
} from "../../services/channelService";
import useChatStore from "../../store/chatStore";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import { getWorkspaceMembers } from "../../services/workspaceService";

export default function ChannelSettingsModal({ open, onOpenChange }) {
  const currentUser = useAuthStore((s) => s.user);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  const activeChannel = useChatStore((s) => s.activeChannel);
  const role = activeChannel?.role;

/* ✅ unified permission flags */
const canRename = ["admin", "moderator"].includes(role);
const canTogglePrivacy = role === "admin"; // backend rule
const canManageMembers = ["admin", "moderator"].includes(role);
const workspaceRole = currentUser?.role; 
const canDelete =
  workspaceRole === "admin" ||
  activeChannel?.createdBy === currentUser?._id;



  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [members, setMembers] = useState([]);
  const [newMemberId, setNewMemberId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeChannel && open) {
      setName(activeChannel.name);
      setIsPrivate(activeChannel.isPrivate);
      fetchMembers();
    }
  }, [activeChannel, open]);

  const fetchMembers = async () => {
    try {
      if (activeChannel.isPrivate) {
        // 🔐 PRIVATE → only channel members
        const res = await getChannelMembers(activeChannel._id);
        setMembers(res.data);
      } else {
        // 🌍 PUBLIC → fetch ALL workspace members
        const res = await getWorkspaceMembers(activeChannel.workspace);
        
        // ❌ remove yourself
        const filtered = res.data.filter(
          (u) => u._id !== currentUser._id
        );

        setMembers(filtered);
      }
    } catch (err) {
      toast.error("Failed to load members");
    }
  };

const handleDelete = async () => {
  const confirm = window.confirm(
    "Are you sure you want to delete this channel? This action cannot be undone."
  );
  if (!confirm) return;

  setLoading(true);
  try {
    await deleteChannel(activeChannel._id);
    toast.success("Channel deleted successfully");
    
    //  Close modal and clear active channel in store
    onOpenChange(false);
    useChatStore.getState().setActiveChannel(null); 
    const store = useChatStore.getState();

store.setChannels((prev) =>
  prev.filter((ch) => ch._id !== activeChannel._id)
);

  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to delete channel");
  } finally {
    setLoading(false);
  }
};


  const handleSave = async () => {
    if (
      name === activeChannel.name &&
      isPrivate === activeChannel.isPrivate
    ) {
      toast("No changes made");
      return;
    }

    setLoading(true);
    try {
      await updateChannelSettings(activeChannel._id, {
        name,
        isPrivate,
      });

      toast.success("Settings updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };


  const handleAddMember = async () => {
    if (!newMemberId) return;
    try {
      await updateChannelMembers(activeChannel._id, {
        addByEmail: [newMemberId],
      });

      toast.success("Member added");
      setNewMemberId("");
      fetchMembers();
    } catch (err) {
      toast.error("User not found or already in channel");
    }
  };

  const handleRemoveMember = async (id) => {
    try {
      await updateChannelMembers(activeChannel._id, { remove: [id] });
      setMembers((prev) => prev.filter((m) => m._id !== id));
      toast.success("Member removed");
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

const handleRoleChange = async (id, newRole) => {
    try {
      await updateChannelRole(activeChannel._id, { userId: id, role: newRole });
      
      // ✅ Update local state so the select reflects the change
      setMembers((prev) =>
        prev.map((m) => (m._id === id ? { ...m, role: newRole } : m))
      );

      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error("Permission denied");
      // Optional: re-fetch members here if you want to be 100% sure UI matches DB
    }
  };

  if (!activeChannel) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] 
                     bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200
                     flex flex-col max-h-[85vh]" // 👈 Flex container with viewport-based max height
        >
          
          {/* FIXED HEADER */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Settings2 size={20} className="text-purple-600" />
              <Dialog.Title className="text-lg font-bold text-gray-800">Channel Settings</Dialog.Title>
            </div>
            <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* SECTION: GENERAL */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">General</h3>
              {canRename && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Channel Name</label>
                  <input
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. general-chat"
                  />
                </div>
              )}

              {canTogglePrivacy && (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3">
                    {isPrivate ? <Lock size={18} className="text-purple-600" /> : <Globe size={18} className="text-purple-600" />}
                    <div>
                      <p className="text-sm font-semibold text-purple-900">
                        {isPrivate ? "Private Channel" : "Public Channel"}
                      </p>
                      <p className="text-xs text-purple-700/70">
                        {isPrivate ? "Only invited users can see this" : "Anyone in workspace can join"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isPrivate ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}
            </div>

            {/* SECTION: MEMBERS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Members ({members.length})</h3>
              {canManageMembers && isPrivate && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      placeholder="Enter user email..."
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                  <button onClick={handleAddMember} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-2 mt-4">
                {members.map((m) => (
                  <div key={m._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {m.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.name || "Unknown User"}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{m._id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {role === "admin" ? (
                        <select
                          className="text-xs bg-white border border-gray-200 rounded-lg p-1 outline-none"
                          onChange={(e) => handleRoleChange(m._id, e.target.value)}
                          value={m.role || "member"}
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">
                          {m.role || "member"}
                        </span>
                      )}
                      {canManageMembers && isPrivate && (
                        <button onClick={() => handleRemoveMember(m._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION: DANGER ZONE (Now inside scroll area) */}
            {canDelete && (
              <div className="mt-8 pt-6 border-t border-red-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-4">Danger Zone</h3>
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-900">Delete Channel</p>
                    <p className="text-xs text-red-700/70">Irreversible action.</p>
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-2.5 bg-white text-red-600 border border-red-200 rounded-xl 
                              hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                  >

                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FIXED FOOTER */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
            <button 
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
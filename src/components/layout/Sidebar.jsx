import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  Settings, Check, Trash, Pencil, UserPlus, X, 
  Loader2, Copy, CheckCircle2, Link as LinkIcon, 
  Search
} from "lucide-react";
import Channels from "../sidebar/Channels";
import DirectMessages from "../sidebar/DirectMessages";
import { getChannels } from "../../services/channelService";
import useChatStore from "../../store/chatStore";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
  updateWorkspace, 
  deleteWorkspace, 
  getWorkspaceById, 
  generateInviteLink // Ensure this is imported
} from "../../services/workspaceService";
import MembersPanel from "../chat/MembersPanel";
import useAuthStore from "../../store/authStore";

export default function Sidebar() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* STORE */
  const setChannels = useChatStore((s) => s.setChannels);
  const setWorkspace = useChatStore((s) => s.setWorkspace);
  const channels = useChatStore((s) => s.channels);
  const workspace = useChatStore((s) => s.workspace);
  const isAdmin = workspace?.role === "admin";
  const role = workspace?.role;

  const user = useAuthStore((s) => s.user);
  const isOwner = workspace?.owner?._id === user?._id;
  const isModerator = role === "moderator";


  /* UI STATE */
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState("");
  const [sortOption, setSortOption] = useState("az");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceColor, setWorkspaceColor] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  /* FETCH DATA */
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [channelsRes, workspaceRes] = await Promise.all([
          getChannels(id),
          getWorkspaceById(id), // Using service instead of raw axios
        ]);

        setChannels(channelsRes.data);
        setWorkspace(workspaceRes.data);
        
        if (workspaceRes.data) {
          setWorkspaceName(workspaceRes.data.name || "");
          setWorkspaceColor(workspaceRes.data.color || "bg-purple-500");
          setWorkspaceDescription(workspaceRes.data.description || "");
        }
      } catch (err) {
        console.error("Sidebar fetch error:", err);
        if (err.response?.status === 404) navigate("/");
      }
    };

    fetchData();
  }, [id, setChannels, setWorkspace, navigate]);

  /* ACTIONS */

  const handleOpenWorkspaceInfo = () => {
    navigate(`/workspace/${id}/info`);
    setOpen(false); // close popover
  };


  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteWorkspace(id);
      setWorkspace(null);
      setChannels([]);
      navigate("/workspace", { replace: true });
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

const handleGenerateInvite = async () => {
  setLoading(true);
  try {
    const res = await generateInviteLink(id);

    //  USE BACKEND LINK DIRECTLY
    setInviteLink(res.data.inviteLink);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    setLoading(true);
    try {
      const response = await updateWorkspace(id, {
        name: workspaceName,
        description: workspaceDescription,
        color: workspaceColor,
      });
      setWorkspace(response.data);
      setUpdateOpen(false);
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

const handleRemoveMember = async () => {
  setLoading(true);

  try {
    useChatStore.getState().setWorkspace((ws) => {
      if (!ws) return ws;

      return {
        ...ws,
        members: ws.members.filter(
          (m) => m.user._id !== selectedMember._id
        ),
      };
    });

    await api.delete(`/workspaces/${id}/members/${selectedMember._id}`);

    setRemoveMemberOpen(false);
    setSelectedMember(null);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const handleMarkAsRead = async () => {
  try {
    await api.put(`/workspaces/${id}/mark-read`);

    setChannels(
      channels.map((c) => ({
        ...c,
        unreadCount: 0,
      }))
    );
    setOpen(false);

  } catch (err) {
    console.error("Mark as read failed:", err);
  }
};






  const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const colors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"];

  return (
    <div className="w-64 bg-white border-r p-4 flex flex-col h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center cursor-pointer justify-center text-white font-semibold ${workspace?.color || "bg-purple-500"}`}
          onClick={handleOpenWorkspaceInfo}
          >
            {getInitials(workspace?.name || "W")}
          </div>
          <h2 className="font-semibold text-md truncate">
            {workspace?.name || "Workspace"}
          </h2>
        </div>

        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded shrink-0">
              <Settings size={18} />
            </button>
          </Popover.Trigger>

          <Popover.Content className="bg-white w-56 p-2 rounded-xl shadow-lg border z-[60]" sideOffset={5}>
            <p className="text-[10px] font-bold uppercase text-gray-400 px-2 py-1">Workspace Settings</p>

           {/* VIEW INFO - everyone */}
<button
  onClick={handleOpenWorkspaceInfo}
  className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded font-medium text-indigo-600"
>
  <Settings size={14} /> View Workspace Info
</button>


{/* UPDATE - only ADMIN */}
{isAdmin && (
  <button
    onClick={() => setUpdateOpen(true)}
    className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded"
  >
    <Pencil size={14} /> Update Details
  </button>
)}

{/* MANAGE MEMBERS - only ADMIN */}
{isAdmin && (
  <button
    onClick={() => setMembersDialogOpen(true)}
    className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded"
  >
    <UserPlus size={14} /> Manage Members
  </button>
)}
<div className="border-t my-1"></div>

<p className="text-[10px] font-bold uppercase text-slate-400 px-3 py-2 mt-2">Filter & Sort Channels</p>

<div className="px-2 space-y-2 mb-3">
  {/* Filter by Status */}
  <div className="relative">
    <select
      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-slate-700"
      onChange={(e) => setFilterStatus(e.target.value)}
      value={filterStatus}
    >
      <option value="all">All Channels</option>
      <option value="public">Public</option>
      <option value="private">Private</option>
    </select>
  </div>

  {/* Sort by */}
  <div className="relative">
    <select
      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-slate-700"
      onChange={(e) => setSortOption(e.target.value)}
      value={sortOption}
    >
      <option value="az">Name: A-Z</option>
      <option value="newest">Newest First</option>
    </select>
  </div>
</div>
<div className="border-t my-1"></div>

<button
  onClick={handleMarkAsRead}
  className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded text-green-600 font-medium"
>
  <Check size={14} /> Mark all as read
</button>

{/* INVITE - ADMIN + MODERATOR */}
{(isAdmin || isModerator) && (
  <button 
    onClick={() => { setInviteOpen(true); setOpen(false); }} 
    className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded text-purple-600 font-medium"
  >
    <LinkIcon size={14} /> Invite via Link
  </button>
)}



<div className="border-t my-1"></div>

{/* DELETE - ONLY OWNER */}
{isOwner && (
  <button
    onClick={() => setDeleteOpen(true)}
    className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded"
  >
    <Trash size={14} /> Delete Workspace
  </button>
)}

            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Root>
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search channels..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          />
        </div>
        <Channels 
          channels={channels} 
          filter={channelFilter} 
          sort={sortOption} 
          status={filterStatus} 
        />
        <DirectMessages />
      </div>
      {/* UPDATE WORKSPACE MODAL */}
      <Dialog.Root open={updateOpen} onOpenChange={setUpdateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-2xl w-[520px] shadow-2xl z-50 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-slate-900">Update Workspace</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  placeholder="e.g. Design Team"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                <textarea
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all h-24 resize-none"
                  placeholder="What is this workspace for?"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Theme Color</label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setWorkspaceColor(color)}
                      className={`w-10 h-10 rounded-xl transition-transform hover:scale-105 ${color} ${
                        workspaceColor === color ? "ring-4 ring-offset-2 ring-purple-500" : "ring-1 ring-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
              <Dialog.Close asChild>
                <button className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleUpdateWorkspace}
                disabled={loading || !workspaceName.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-200 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MANAGE MEMBERS DIALOG */}
<Dialog.Root open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl w-[450px] shadow-2xl z-50 overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between bg-gray-50">
        <Dialog.Title className="text-xl font-bold text-gray-800">Workspace Members</Dialog.Title>
        <Dialog.Close asChild>
          <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </Dialog.Close>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        <MembersPanel />
      </div>

      <div className="p-4 bg-gray-50 border-t flex justify-end">
        <Dialog.Close asChild>
          <button className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium">
            Done
          </button>
        </Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

      {/* REMOVE MEMBER CONFIRMATION */}
      <Dialog.Root open={removeMemberOpen} onOpenChange={setRemoveMemberOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl w-96 z-50">
            <Dialog.Title className="text-lg font-semibold mb-4 flex items-center justify-between">
              Remove Member
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </Dialog.Title>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{selectedMember?.name}</span> from this workspace?
              </p>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleRemoveMember}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Removing..." : "Remove Member"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* SINGLE DELETE WORKSPACE CONFIRMATION */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl w-96 z-50">
            <Dialog.Title className="text-lg font-semibold mb-4 flex items-center justify-between">
              Delete Workspace
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </Dialog.Title>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <span className="font-semibold">"{workspace?.name || 'Workspace'}"</span>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone and will permanently delete all channels and messages.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Deleting..." : "Delete Workspace"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* INVITE MODAL */}
      <Dialog.Root open={inviteOpen} onOpenChange={(val) => { setInviteOpen(val); if(!val) setInviteLink(""); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl w-96 z-50 shadow-2xl">
            <Dialog.Title className="text-lg font-semibold mb-2">Invite to {workspace?.name}</Dialog.Title>
            <p className="text-sm text-gray-500 mb-6">
              Anyone with this link will be able to join this workspace as a member.
            </p>

            {!inviteLink ? (
              <button
                onClick={handleGenerateInvite}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Generating..." : "Generate Invite Link"}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-purple-100">
                  <input
                    readOnly
                    value={inviteLink}
                    className="bg-transparent flex-1 text-sm outline-none text-gray-600 truncate"
                  />
                  <button onClick={copyToClipboard} className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-md transition-colors">
                    {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Check size={12} />
                  <span>Link expires in 7 days</span>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Close
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

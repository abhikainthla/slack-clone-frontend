import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import { Settings, Check, Trash, Pencil, UserPlus, X, Loader2 } from "lucide-react";
import Channels from "../sidebar/Channels";
import DirectMessages from "../sidebar/DirectMessages";
import { getChannels } from "../../services/channelService";
import useChatStore from "../../store/chatStore";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { inviteToWorkspace, updateWorkspace, deleteWorkspace, getWorkspaceById } from "../../services/workspaceService";

export default function Sidebar() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* STORE */
  const setChannels = useChatStore((s) => s.setChannels);
  const setWorkspace = useChatStore((s) => s.setWorkspace);
  const clearChannels = useChatStore((s) => s.setChannels); // For clearing on delete
  const channels = useChatStore((s) => s.channels);
  const workspace = useChatStore((s) => s.workspace);

  /* UI STATE */
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false); // ✅ SINGLE delete dialog
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceColor, setWorkspaceColor] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);

  /* FETCH DATA */
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [channelsRes, workspaceRes] = await Promise.all([
          getChannels(id),
          api.get(`/workspaces/${id}`),
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
        // If workspace 404, redirect to workspaces list
        if (err.response?.status === 404) {
          navigate("/");
        }
      }
    };

    fetchData();
  }, [id, setChannels, setWorkspace, navigate]);

  /* HELPERS */
  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  /* ACTIONS */
  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteWorkspace(id);
      // ✅ Clear store and redirect to workspaces list
      setWorkspace(null);
      setChannels([]);
      navigate("/workspace", { replace: true });; // replace: true removes deleted workspace from history
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
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
      console.error("Update error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    setLoading(true);
    try {
      await api.delete(`/workspaces/${id}/members/${selectedMember._id}`);
      const workspaceRes = await getWorkspaceById(id);
      setWorkspace(workspaceRes.data);
      setRemoveMemberOpen(false);
      setSelectedMember(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async () => {
    try {
      await api.put(`/workspaces/${id}/mark-read`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSort = async (type) => {
    try {
      const res = await api.get(`/workspaces/${id}/filter?sort=${type}`);
      setChannels(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async () => {
    try {
      await inviteToWorkspace(id, email);
      setEmail("");
      setInviteOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  return (
    <div className="w-64 bg-white border-r p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${
              workspace?.color || "bg-purple-500"
            }`}
          >
            {getInitials(workspace?.name || "W")}
          </div>
          <h2 className="font-semibold text-md">
            {workspace?.name || "Workspace"}
          </h2>
        </div>

        {/* SETTINGS POPOVER */}
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Settings size={18} />
            </button>
          </Popover.Trigger>

          <Popover.Content className="bg-white w-56 p-3 rounded-xl shadow-lg border">
            <p className="text-xs text-gray-400 mb-2">Workspace Settings</p>

            {/* UPDATE */}
            <button
              onClick={() => setUpdateOpen(true)}
              className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded"
            >
              <Pencil size={14} /> Update Workspace
            </button>

            {/* MEMBERS */}
            <button
              onClick={() => setMembersDialogOpen(true)}
              className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded"
            >
              <UserPlus size={14} /> Manage Members
            </button>

            {/* INVITE */}
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded"
            >
              <UserPlus size={14} /> Invite to Workspace
            </button>

            <div className="border-t my-2"></div>

            {/* DELETE WORKSPACE BUTTON */}
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded"
              disabled={!workspace || loading}
            >
              <Trash size={14} /> Delete "{workspace?.name || 'Workspace'}"
            </button>

            <div className="border-t my-2"></div>

            {/* MARK READ */}
            <button
              onClick={handleMarkRead}
              className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 rounded"
              disabled={loading}
            >
              <Check size={14} /> Mark all as read
            </button>

            <div className="border-t my-2"></div>

            {/* SORT */}
            <p className="text-xs text-gray-400 mb-1">Sort</p>
            <button
              onClick={() => handleSort("az")}
              className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
              disabled={loading}
            >
              Sort A-Z
            </button>
            <button
              onClick={() => handleSort("recent")}
              className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
              disabled={loading}
            >
              Sort by Recency
            </button>

            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Root>
      </div>

      <Channels channels={channels} />
      <DirectMessages />

      {/* UPDATE WORKSPACE MODAL */}
      <Dialog.Root open={updateOpen} onOpenChange={setUpdateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl w-96 max-h-[90vh] overflow-y-auto z-50">
            <Dialog.Title className="text-lg font-semibold mb-4 flex items-center justify-between">
              Update Workspace
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Workspace name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setWorkspaceColor(color)}
                      className={`w-10 h-10 rounded-lg border-2 ${
                        workspaceColor === color ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
                      } ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleUpdateWorkspace}
                disabled={loading || !workspaceName.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Updating..." : "Update Workspace"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MANAGE MEMBERS DIALOG */}
      <Dialog.Root open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl w-[500px] max-h-[90vh] overflow-y-auto z-50">
            <Dialog.Title className="text-lg font-semibold mb-4 flex items-center justify-between">
              Manage Members
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </Dialog.Title>

            <div className="space-y-3 mb-6">
              {workspace?.members?.map((member) => (
                <div key={member.user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                      {getInitials(member.user.name)}
                    </div>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                    </div>
                  </div>
                  {member.user._id !== workspace?.owner?._id && (
                    <button
                      onClick={() => {
                        setSelectedMember(member.user);
                        setMembersDialogOpen(false);
                        setRemoveMemberOpen(true);
                      }}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
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

      {/* ✅ SINGLE DELETE WORKSPACE CONFIRMATION */}
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
      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl w-96">
            <Dialog.Title className="text-lg font-semibold mb-3 flex items-center justify-between">
              Invite to Workspace
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </Dialog.Title>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              </Dialog.Close>
              <button
                onClick={handleInvite}
                disabled={!email.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Send Invite
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

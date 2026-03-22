import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import toast from "react-hot-toast";
import { Loader2, Shield, User, UserMinus, ShieldAlert } from "lucide-react";
import useChatStore from "../../store/chatStore";
import { promoteMember, demoteMember, removeMember } from "../../services/workspaceService";

export default function MembersPanel() {
  const workspace = useChatStore((s) => s.workspace);
  const currentUserId = useChatStore((s) => s.userId);
  const [processingId, setProcessingId] = useState(null);

  if (!workspace) return null;

  const currentMember = workspace.members?.find(
    (m) => m.user._id.toString() === currentUserId?.toString()
  );
  const isAdmin = currentMember?.role === "admin";

  const handleUpdateStore = (userId, newRole, action = "update") => {
    const updated = { ...workspace };
    if (action === "remove") {
      updated.members = updated.members.filter((m) => m.user._id !== userId);
    } else {
      updated.members = updated.members.map((m) =>
        m.user._id === userId ? { ...m, role: newRole } : m
      );
    }
    useChatStore.getState().setWorkspace(updated);
  };

  const executeAction = async (userId, actionFn, newRole, type, label) => {
    setProcessingId(userId);
    const loadingToast = toast.loading(`${label}...`);
    try {
      await actionFn(workspace._id, userId);
      handleUpdateStore(userId, newRole, type);
      toast.success(`${label} successful`, { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${label.toLowerCase()}`, { id: loadingToast });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Tooltip.Provider delayDuration={400}>
      <div className="p-4 space-y-1">
        {workspace.members?.map((member) => {
          const isOwner = member.user._id.toString() === (workspace.owner?._id || workspace.owner)?.toString();
          const isSelf = member.user._id.toString() === currentUserId?.toString();
          const isProcessing = processingId === member.user._id;

          return (
            <div key={member.user._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isOwner ? 'bg-amber-500' : 'bg-blue-500'}`}>
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isSelf ? "text-blue-600" : "text-gray-900"}`}>
                      {member.user.name}
                    </span>
                    {isOwner && <Shield size={12} className="text-amber-500" fill="currentColor" />}
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                </div>
              </div>

              {isAdmin && !isOwner && !isSelf && (
                <div className="flex gap-1">
                  {/* PROMOTE ACTION */}
                  {member.role === "member" && (
                    <ConfirmAction
                      icon={<Shield size={16} />}
                      label="Promote to Moderator"
                      description={`This will give ${member.user.name} ability to manage channels.`}
                      onConfirm={() => executeAction(member.user._id, promoteMember, "moderator", "update", "Promoting")}
                      colorClass="text-purple-600 hover:bg-purple-50"
                      isLoading={isProcessing}
                    />
                  )}

                  {/* DEMOTE ACTION */}
                  {member.role === "moderator" && (
                    <ConfirmAction
                      icon={<User size={16} />}
                      label="Demote to Member"
                      description={`Are you sure you want to remove moderator perks from ${member.user.name}?`}
                      onConfirm={() => executeAction(member.user._id, demoteMember, "member", "update", "Demoting")}
                      colorClass="text-yellow-600 hover:bg-yellow-50"
                      isLoading={isProcessing}
                    />
                  )}

                  {/* REMOVE ACTION */}
                  <ConfirmAction
                    icon={<UserMinus size={16} />}
                    label="Remove Member"
                    description={`This will permanently kick ${member.user.name} from the workspace.`}
                    onConfirm={() => executeAction(member.user._id, removeMember, null, "remove", "Removing")}
                    colorClass="text-red-500 hover:bg-red-50"
                    isDanger
                    isLoading={isProcessing}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Tooltip.Provider>
  );
}

/* --- REUSABLE HELPER COMPONENT --- */
function ConfirmAction({ icon, label, description, onConfirm, colorClass, isDanger, isLoading }) {
  return (
    <AlertDialog.Root>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <AlertDialog.Trigger asChild>
            <button disabled={isLoading} className={`p-2 rounded-md transition-colors ${colorClass}`}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : icon}
            </button>
          </AlertDialog.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-md z-[100]" sideOffset={5}>
            {label}
            <Tooltip.Arrow className="fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[110]" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl w-[350px] z-[120]">
          <div className="flex items-center gap-3 mb-3 text-amber-600">
             <ShieldAlert size={24} />
             <AlertDialog.Title className="text-lg font-bold text-gray-900">{label}</AlertDialog.Title>
          </div>
          <AlertDialog.Description className="text-sm text-gray-600 mb-6">
            {description}
          </AlertDialog.Description>
          <div className="flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button 
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                Confirm
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
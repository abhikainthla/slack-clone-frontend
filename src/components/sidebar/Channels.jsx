import { useEffect, useState } from "react";
import useChatStore from "../../store/chatStore";
import { useParams } from "react-router-dom";
import CreateChannelModal from "../modals/CreateChannelModal";
import useAuthStore from "../../store/authStore";
import { getWorkspaceChannels } from "../../services/channelService";

export default function Channels() {
  const { id: workspaceId } = useParams();

  const channels = useChatStore((s) => s.channels);
  const activeChannel = useChatStore((s) => s.activeChannel);
  const setChannels = useChatStore((s) => s.setChannels);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const setUserId = useChatStore((s) => s.setUserId);
  const workspace = useChatStore((s) => s.workspace);
  const authUser = useAuthStore((s) => s.user);

  const role = workspace?.members?.find(
    (m) => m.user?._id === authUser?._id
  )?.role;

  const isAdmin = role === "admin" || role === "moderator";


  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (authUser?._id) {
      setUserId(authUser._id);
    }
  }, [authUser?._id, setUserId]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await getWorkspaceChannels(workspaceId);
        setChannels(res.data, authUser?._id);
      } catch (err) {
        console.error("Failed to load channels", err);
      }
    };

    if (workspaceId) fetchChannels();
  }, [workspaceId, authUser?._id, setChannels]);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs text-gray-400">CHANNELS</p>

        {/*  ONLY ADMIN/MODERATOR */}
        {isAdmin && (
          <button
            onClick={() => setOpen(true)}
            className="text-sm text-purple-600"
          >
            + Add
          </button>
        )}
      </div>

      {/*  MODAL ONLY FOR ADMIN */}
      {isAdmin && (
        <CreateChannelModal open={open} onOpenChange={setOpen} />
      )}

      {channels.length === 0 && (
        <p className="text-sm text-gray-400 px-2">No channels yet</p>
      )}

      {channels.map((channel) => {
        const isActive = activeChannel?._id === channel._id;

        return (
          <div
            key={channel._id}
            onClick={() => setActiveChannel(channel, authUser?._id)}
            className={`px-2 py-1 rounded cursor-pointer flex justify-between ${
              isActive
                ? "bg-purple-200 font-medium"
                : "hover:bg-gray-100"
            }`}
          >
            <span
              className={`${
                channel.hasUnread && !isActive
                  ? "font-bold text-gray-900"
                  : "text-gray-700"
              }`}
            >
              # {channel.name}
            </span>
            {channel.hasUnread && !isActive && (
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
            )}

            <span className="text-xs text-gray-400">
              {channel.role}
            </span>
          </div>
        );
      })}
    </div>
  );
}

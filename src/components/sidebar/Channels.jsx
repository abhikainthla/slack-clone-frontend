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

  const [open, setOpen] = useState(false);
  const authUser = useAuthStore((s) => s.user);

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
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-purple-600"
        >
          + Add
        </button>
      </div>

      <CreateChannelModal open={open} onOpenChange={setOpen} />

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
            <span># {channel.name}</span>
            <span className="text-xs text-gray-400">
              {channel.role}
            </span>
          </div>
        );
      })}
    </div>
  );
}

import { useEffect, useState, useMemo } from "react"; // 1. Added useMemo
import useChatStore from "../../store/chatStore";
import { useParams } from "react-router-dom";
import CreateChannelModal from "../modals/CreateChannelModal";
import useAuthStore from "../../store/authStore";
import { getWorkspaceChannels } from "../../services/channelService";
import api from "../../api/axios";

export default function Channels({ filter = "", sort = "az", status = "all" }) {
  const { id: workspaceId } = useParams();
  const [loading, setLoading] = useState(true);

  const channels = useChatStore((s) => s.channels);
  const activeChannel = useChatStore((s) => s.activeChannel);
  const setChannels = useChatStore((s) => s.setChannels);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const setUserId = useChatStore((s) => s.setUserId);
  const workspace = useChatStore((s) => s.workspace);
  const authUser = useAuthStore((s) => s.user);

  const role = workspace?.members?.find(
    (m) => m.user?._id?.toString() === authUser?._id?.toString()
  )?.role || "member";

  const canCreate = role === "admin" || role === "moderator";
  const [open, setOpen] = useState(false);

  const getStoredChannelUnread = () =>
  JSON.parse(localStorage.getItem("channelUnread") || "{}");

const setStoredChannelUnread = (data) =>
  localStorage.setItem("channelUnread", JSON.stringify(data));


  const processedChannels = useMemo(() => {
    return [...channels]
      .filter((ch) => {
        const matchesName = ch.name.toLowerCase().includes(filter.toLowerCase());
        const matchesStatus = status === "all" 
          ? true 
          : (status === "private" ? ch.isPrivate : !ch.isPrivate);
        return matchesName && matchesStatus;
      })
      .sort((a, b) => {
        if (sort === "az") return a.name.localeCompare(b.name);
        if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
      });
  }, [channels, filter, sort, status]); // Re-run when these change

  useEffect(() => {
    if (authUser?._id) setUserId(authUser._id);
  }, [authUser?._id, setUserId]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await getWorkspaceChannels(workspaceId);
        setChannels(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (workspaceId) fetchChannels();
  }, [workspaceId]);





  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">CHANNELS</h1>
        {canCreate && (
          <button onClick={() => setOpen(true)} className="text-sm text-purple-600">
            + Add
          </button>
        )}
      </div>

      {canCreate && <CreateChannelModal open={open} onOpenChange={setOpen} />}

      {/* 3. Mapped over processedChannels instead of the old filteredChannels */}
      {processedChannels.length === 0 ? (
        <p className="text-sm text-gray-400 px-2">No channels found</p>
      ) : (
        processedChannels.map((channel) => {
          const isActive = activeChannel?._id === channel._id;
          const hasUnread = (channel.unreadCount || 0) > 0;

          return (
            <div
              key={channel._id}
              onClick={() => setActiveChannel(channel)}
              className={`px-2 py-1 rounded cursor-pointer flex justify-between items-center ${
                isActive ? "bg-purple-200 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                {/* NOTIFICATION DOT */}
                {hasUnread && !isActive && (
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"  />
                )}

                <span
                  className={`${
                    hasUnread && !isActive
                      ? "font-bold text-gray-900"
                      : "text-gray-700"
                  }`}
                >
                  {channel.isPrivate ? "🔒" : "#"} {channel.name}
                </span>
              </div>
            </div>

          );
        })
      )}
    </div>
  );
}
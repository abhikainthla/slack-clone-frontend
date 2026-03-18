import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { createChannel } from "../../services/channelService";
import { useParams } from "react-router-dom";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";

export default function CreateChannelModal({ open, onOpenChange }) {
  const { id: workspaceId } = useParams();

  const channels = useChatStore((s) => s.channels);
  const setChannels = useChatStore((s) => s.setChannels);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);

  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setIsPrivate(false);
      setLoading(false);
      setError("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim() || !workspaceId) {
      setError("Channel name & workspace required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await createChannel({
        name: name.trim(),
        workspaceId,
        isPrivate,
      });

      const updatedChannels = [...channels, res.data];

      setChannels(updatedChannels, user?._id);
      setActiveChannel(res.data, user?._id);

      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      handleCreate();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

        <Dialog.Content className="fixed top-1/2 left-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl border">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Create Channel
          </Dialog.Title>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <input
            placeholder="channel-name (no spaces)"
            className="w-full border px-3 py-2 rounded mb-4 outline-none focus:ring-2 focus:ring-purple-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
          />

          <label className="flex items-center gap-2 mb-6 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={() => setIsPrivate((prev) => !prev)}
              disabled={loading}
            />
            Private Channel 🔒
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim() || !workspaceId || !user?._id}
              className={`flex-1 py-2 px-4 rounded text-white ${
                loading || !name.trim() || !workspaceId || !user?._id
                  ? "bg-gray-400"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {loading ? "Creating..." : "Create Channel"}
            </button>

            <button
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

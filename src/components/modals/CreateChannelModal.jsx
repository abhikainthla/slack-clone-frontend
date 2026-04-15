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
  const [selectedMembers, setSelectedMembers] = useState([]);
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
        members: isPrivate ? selectedMembers : [],
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
          {/* Overlay */}
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[460px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border p-6">

            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <Dialog.Title className="text-xl font-semibold">
                  Create Channel
                </Dialog.Title>
                <p className="text-sm text-gray-500 mt-1">
                  Add a new channel to this workspace.
                </p>
              </div>

              <Dialog.Close className="text-gray-400 hover:text-gray-600 text-lg">
                ✕
              </Dialog.Close>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Channel Name */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Channel Name
              </label>
              <input
                placeholder="e.g. design-team"
                className="w-full mt-1 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                placeholder="What's this channel about?"
                className="w-full mt-1 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Private Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium">Private Channel</p>
                <p className="text-xs text-gray-500">
                  Only invited members can access
                </p>
              </div>

              {isPrivate && (
                <div className="mb-4">
                  <label className="text-sm font-medium">
                    Add Members
                  </label>

                  {/* Replace with your user selector */}
                  <input
                    placeholder="Enter user IDs (comma separated)"
                    onChange={(e) =>
                      setSelectedMembers(
                        e.target.value.split(",").map((id) => id.trim())
                      )
                    }
                    className="w-full mt-1 border px-3 py-2 rounded"
                  />
                </div>
              )}


              {/* Toggle */}
              <button
                onClick={() => setIsPrivate((p) => !p)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                  isPrivate ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                    isPrivate ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className={`px-5 py-2 rounded-md text-white font-medium ${
                  loading || !name.trim()
                    ? "bg-purple-300"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {loading ? "Creating..." : "Create Channel"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

  );
}

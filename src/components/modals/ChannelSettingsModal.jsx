import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import {
  updateChannel,
  deleteChannel,
} from "../../services/channelService";
import useChatStore from "../../store/chatStore";

export default function ChannelSettingsModal({ open, onOpenChange }) {
  const activeChannel = useChatStore((s) => s.activeChannel);
  const setChannels = useChatStore((s) => s.setChannels);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);

  const role = activeChannel?.role || "member";
  const isAdmin = role === "admin";

  const [name, setName] = useState("");

  /* ✅ SYNC NAME */
  useEffect(() => {
    if (activeChannel?.name) {
      setName(activeChannel.name);
    }
  }, [activeChannel]);

  /* ✅ UPDATE CHANNEL */
  const handleUpdate = async () => {
    if (!activeChannel?._id || !name.trim()) return;

    try {
      const res = await updateChannel(activeChannel._id, {
        name: name.trim(),
      });

      /* 🔥 PRESERVE ROLE FROM OLD CHANNEL */
      const updatedChannel = {
        ...res.data,
        role: activeChannel.role, // ✅ KEEP ROLE
      };

      /* ✅ UPDATE CHANNEL LIST */
      setChannels((prev) =>
        prev.map((c) =>
          c._id === activeChannel._id
            ? { ...c, ...updatedChannel } // ✅ MERGE (DO NOT REPLACE)
            : c
        )
      );

      /* ✅ UPDATE ACTIVE CHANNEL */
      setActiveChannel((prev) => ({
        ...prev,
        ...updatedChannel,
      }));

      onOpenChange(false);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  /* ✅ DELETE CHANNEL */
  const handleDelete = async () => {
    if (!activeChannel?._id) return;

    try {
      await deleteChannel(activeChannel._id);

      setChannels((prev) =>
        prev.filter((c) => c._id !== activeChannel._id)
      );

      setActiveChannel(null);

      onOpenChange(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!activeChannel) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

        <Dialog.Content className="fixed top-1/2 left-1/2 w-[460px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border p-6">

          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <Dialog.Title className="text-xl font-semibold">
                Edit Channel
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">
                Update channel settings or delete it.
              </p>
            </div>

            <Dialog.Close className="text-gray-400 hover:text-gray-600 text-lg">
              ✕
            </Dialog.Close>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">
              Channel Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-6">

            {/* Delete */}
            {isAdmin && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Channel
              </button>
            )}

            {/* Right side buttons */}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                disabled={!name.trim()}
                className={`px-5 py-2 rounded-md text-white ${
                  !name.trim()
                    ? "bg-purple-300"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

  );
}

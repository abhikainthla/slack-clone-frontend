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
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />

        <Dialog.Content className="fixed top-1/2 left-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow">
          
          <h2 className="font-semibold mb-4">
            Channel Settings
          </h2>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-4"
          />

          <button
            onClick={handleUpdate}
            disabled={!name.trim()}
            className={`w-full py-2 rounded mb-2 text-white ${
              !name.trim()
                ? "bg-gray-400"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Save Changes
          </button>

          {isAdmin && (
            <button
              onClick={handleDelete}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
            >
              Delete Channel
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { useState } from "react";
import useChatStore from "../../store/chatStore";
import ChannelSettingsModal from "../modals/ChannelSettingsModal";
import RoleBadge from "../common/RoleBadge";
import { Settings } from "lucide-react";

export default function ChatHeader() {
  const activeChannel = useChatStore((s) => s.activeChannel);
  
  // ✅ More detailed logging
  console.log("ChatHeader RENDER:", { 
    activeChannelId: activeChannel?._id, 
    activeChannelName: activeChannel?.name,
    activeChannel: activeChannel 
  });

  const role = activeChannel?.role || "member";
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b px-6 py-4 bg-white">
      {activeChannel?._id ? (
        <>
          <div className="flex justify-between items-center">
            {/* LEFT */}
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">
                # {activeChannel.name}
              </h2>
              <RoleBadge role={role} />
            </div>

            {/* RIGHT */}
            {role === "admin" && (
              <button onClick={() => setOpen(true)}>
                <Settings />
              </button>
            )}
          </div>

          <ChannelSettingsModal
            open={open}
            onOpenChange={setOpen}
          />

          <p className="text-sm text-gray-500">
            Channel discussion
          </p>
        </>
      ) : (
        <p className="text-gray-400">
          Select a channel
        </p>
      )}
    </div>
  );
}

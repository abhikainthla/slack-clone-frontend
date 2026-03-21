import { useState } from "react";
import useChatStore from "../../store/chatStore";
import ChannelSettingsModal from "../modals/ChannelSettingsModal";
import RoleBadge from "../common/RoleBadge";
import { Settings } from "lucide-react";
import BookmarkDialog from "./BookmarkDialog";
import PinnedDialog from "./PinnedDialog";

export default function ChatHeader({ onJump }) {
  const [open, setOpen] = useState(false);


  const { activeChannel, dmUser, isDM } = useChatStore();

  const role = activeChannel?.role || "member";

  return (
    <>
      <header className="border-b h-16 flex items-center px-6 bg-white shrink-0">
        {(activeChannel?._id || isDM) ? (
          <div className="flex items-center justify-between w-full">

            {/* ================= LEFT ================= */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">

                {/* ✅SWITCH BETWEEN DM & CHANNEL */}
                <h2 className="font-bold text-lg text-gray-800 tracking-tight">
                  {isDM
                    ? dmUser?.name
                    : `# ${activeChannel?.name}`}
                </h2>

                {!isDM && <RoleBadge role={role} />}
              </div>

              <p className="text-xs text-gray-500 font-medium">
                {isDM
                  ? "Direct message conversation"
                  : "Channel discussion and updates"}
              </p>
            </div>

            {/* ================= RIGHT ================= */}
            <div className="flex items-center gap-2">

              {/* 📌 PINNED (only for channels) */}
              <PinnedDialog onJump={onJump} />

              {/* 🔖 BOOKMARK */}
              <BookmarkDialog onJump={onJump} />

              {/* ⚙️ SETTINGS (only admin + channel) */}
              {!isDM && role === "admin" && (
                <button
                  onClick={() => setOpen(true)}
                  title="Channel Settings"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center h-full">
            <p className="text-gray-400 italic text-sm">
              Select a channel or user to start chatting
            </p>
          </div>
        )}
      </header>

      {/* ✅ MODAL */}
      {!isDM && (
        <ChannelSettingsModal
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

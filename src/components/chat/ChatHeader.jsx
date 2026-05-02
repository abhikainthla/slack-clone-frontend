import { useState } from "react";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import ChannelSettingsModal from "../modals/ChannelSettingsModal";
import RoleBadge from "../common/RoleBadge";
import { Settings } from "lucide-react";
import BookmarkDialog from "./BookmarkDialog";
import PinnedDialog from "./PinnedDialog";
import { Menu } from "lucide-react";

export default function ChatHeader({ onJump, onMenuClick }) {
  const [open, setOpen] = useState(false);


const { activeChannel, dmUser, isDM, workspace } = useChatStore();
const user = useAuthStore((s) => s.user);

const role =
  workspace?.members?.find(
    (m) => m?.user?._id === user?._id
  )?.role || "member";



  return (
        <>
      <header className="border-b bg-white shrink-0 px-3 sm:px-4 md:px-6 py-2 flex items-center">
        
        {/* MOBILE MENU */}
        <button
          onClick={onMenuClick}
          className="lg:hidden mr-2 p-2 hover:bg-gray-100 rounded-md"
        >
          <Menu size={20} />
        </button>

        {(activeChannel?._id || isDM) ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">

            {/* ================= LEFT ================= */}
            <div className="flex flex-col min-w-0">
              
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-semibold text-sm sm:text-base md:text-lg text-gray-800 truncate">
                  {isDM
                    ? dmUser?.name
                    : `# ${activeChannel?.name}`}
                </h2>

                {!isDM && <RoleBadge role={role} />}
              </div>

              <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                {isDM
                  ? "Direct message conversation"
                  : "Channel discussion and updates"}
              </p>
            </div>

            {/* ================= RIGHT ================= */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">

              {/* PINNED */}
              <PinnedDialog onJump={onJump} />

              {/* BOOKMARK */}
              <BookmarkDialog onJump={onJump} />

              {/* SETTINGS */}
              {!isDM && role === "admin" && (
                <button
                  onClick={() => setOpen(true)}
                  title="Channel Settings"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition shrink-0"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center h-full">
            <p className="text-gray-400 italic text-xs sm:text-sm">
              Select a channel or user to start chatting
            </p>
          </div>
        )}
      </header>

      {/* MODAL */}
      {!isDM && (
        <ChannelSettingsModal
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

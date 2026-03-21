import EmojiPicker from "emoji-picker-react";
import { useState, useEffect, useRef } from "react";
import {
  addReaction,
  pinMessage,
  unpinMessage,
  toggleBookmark,
} from "../../services/messageService";

import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import { Bookmark, BookmarkX, Check, CheckCheck, Pin, PinOff, SmilePlus } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";



export default function MessageItem({ message }) {

  const [showPicker, setShowPicker] = useState(false);

  const user = useAuthStore((s) => s.user);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const toggleReactionLocal = useChatStore((s) => s.toggleReactionLocal);
  const toggleBookmarkLocal = useChatStore((s) => s.toggleBookmarkLocal);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  if (!message || !message._id || !user) return null;
  const isBookmarked = message.bookmarkedBy?.some(
    (id) => id.toString() === user?._id
  );

  const senderId =
  typeof message?.sender === "object"
    ? message?.sender?._id?.toString()
    : message?.sender?.toString();

const isOnline = onlineUsers[senderId] === "online";

  const isMine = message.sender?._id === user?._id;
  const isRead = message.readBy?.some((r) => {
    const id = typeof r.user === "object" ? r.user?._id : r.user;
    return id?.toString() !== user?._id?.toString();
  });





  const codeRef = useRef();

    useEffect(() => {
      Prism.highlightAll();
    }, [message]);
  /* ================= GROUP REACTIONS ================= */
  const groupedReactions = Object.values(
    (message.reactions || []).reduce((acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, users: [] };
      }
      acc[r.emoji].users.push(r.user);
      return acc;
    }, {})
  );


  /* ================= REACTION ================= */
  const handleReaction = async (emoji) => {
  if (!user) return;

  toggleReactionLocal(message._id, emoji, user._id);

  try {
    await addReaction(message._id, emoji);
  } catch (err) {
    console.error(err);
  }
};



  /* ================= PIN ================= */
const handlePin = async () => {
  updateMessage({ ...message, pinned: !message.pinned });

  try {
    if (message.pinned) {
      await unpinMessage(message._id);
    } else {
      await pinMessage(message._id);
    }
  } catch (err) {
    console.error(err);
    updateMessage({ ...message, pinned: message.pinned });
  }
};




const renderContent = (text) => {
  if (!text) return null;

  const parts = text.split(/(@\w+)/g); // split by mentions

  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={i}
          className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-medium"
        >
          {part}
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
};



  /* ================= BOOKMARK ================= */
const handleBookmark = async () => {
  if (!user) return;
  
  toggleBookmarkLocal(message._id, user._id);

  try {
    await toggleBookmark(message._id);
  } catch (err) {
    console.error(err);
    toggleBookmarkLocal(message._id, user._id);
  }
};



  return (
    <div className="flex gap-3 group hover:bg-gray-100 p-3 rounded-lg relative">

      {/* Avatar */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center">
          {message?.sender?.name?.[0] || "U"}
        </div>

        {isOnline && (
          <span className="absolute bottom-0 right-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
            </span>
          </span>
        )}

              </div>

      <div className="flex-1">

        {/* Header */}
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">
            {message?.sender?.name || "Unknown"}
          </p>

          <span className="text-xs text-gray-400">
            {message?.createdAt
              ? new Date(message.createdAt).toLocaleTimeString()
              : ""}
          </span>

          {/* PINNED */}
          {message?.pinned && (
            <span className="flex items-center gap-1 text-[#646ef2] text-xs">
              <Pin size={12} />
              <span>pinned</span>
            </span>
          )}

          {/* BOOKMARKED */}
          {isBookmarked && (
            <span className="flex items-center gap-1 text-yellow-500 text-xs">
              <Bookmark size={12} />
              <span>saved</span>
            </span>
          )}

        </div>

        {/* Content */}
       {message.content?.includes("```") ? (
          <pre className="bg-gray-900 text-white p-3 rounded overflow-x-auto text-xs">
            <code className="language-js">
              {message.content.replace(/```/g, "")}
            </code>
          </pre>
        ) : (
          <div className="text-sm break-words">
  {message.content?.match(/\.(jpeg|jpg|png|gif|webp)$/) ? (
    <img
      src={message.content}
      className="max-w-xs rounded-lg mt-1"
    />
  ) : message.content?.startsWith("http") ? (
    <a
      href={message.content}
      target="_blank"
      className="text-blue-500 underline text-sm"
    >
      View File
    </a>
  ) : message.content?.includes("```") ? (
    <pre className="bg-gray-900 text-white p-3 rounded overflow-x-auto text-xs">
      <code>{message.content.replace(/```/g, "")}</code>
    </pre>
  ) : (
    <span className="flex items-end">{renderContent(message.content)}  
     {isMine && (
  <span className="ml-2 flex items-center">
    {isRead ? (
      <CheckCheck size={14} className="text-blue-500" />
    ) : (
      <Check size={14} className="text-gray-400" />
    )}
  </span>
)}
</span>
  )}

</div>


        )}
        


        {/* Reactions */}
        <div className="flex gap-2 mt-2">
            {groupedReactions.map((reaction, i) => {
             const isMine = reaction.users?.some((u) => {
                const id = typeof u === "object" ? u?._id : u;
                return id?.toString() === user?._id?.toString();
              });

              return (
                <Tooltip.Provider key={i}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div
                        onClick={() => handleReaction(reaction.emoji)}
                        className={`flex items-center gap-1 px-2 py-1 rounded border cursor-pointer transition ${
                          isMine
                            ? "bg-blue-100 border-blue-400"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        <span>{reaction.emoji}</span>

                        {/* Avatar stack */}
                        <div className="flex -space-x-2">
                          {reaction.users.slice(0, 3).map((u, idx) => (
                            <div
                              key={idx}
                              className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center border"
                            >
                              {typeof u === "object" ? u.name?.[0] : "U"}
                            </div>
                          ))}
                        </div>

                        <span className="text-xs">{reaction.users.length}</span>
                      </div>
                    </Tooltip.Trigger>

                    {/* ✅ TOOLTIP */}
                    <Tooltip.Content
                      side="top"
                      className="bg-black text-white text-xs px-2 py-1 rounded shadow"
                    >
                      {reaction.users
                        .map((u) => (typeof u === "object" ? u.name : "User"))
                        .join(", ")}
                    </Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>
              );
            })}
          </div>


      </div>


      {/* Actions */}
      <div className="absolute shadow-lg  rounded-lg bg-white text-gray-500 right-2 top-2 hidden group-hover:flex gap-2">
        <button onClick={() => setShowPicker(!showPicker)} className="p-2 rounded-lg hover:bg-violet-100"><SmilePlus size={16} /></button>
        <button onClick={handlePin} className="p-2 rounded-lg hover:bg-violet-100">
          {message?.pinned ?  <PinOff size={16} /> : <Pin size={16}/>}
        </button>
        <button onClick={handleBookmark} className="p-2 rounded-lg hover:bg-violet-100">
          {isBookmarked ? <BookmarkX size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      {/* Emoji Picker */}
      {showPicker && (
        <div className="absolute right-10 top-10 z-50">
          <EmojiPicker
            onEmojiClick={(e) => {
              handleReaction(e.emoji);
              setShowPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

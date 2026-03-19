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
import { Bookmark, BookmarkX, Pin, PinOff, SmilePlus } from "lucide-react";


export default function MessageItem({ message }) {
  if (!message || !message._id) return null;

  const [showPicker, setShowPicker] = useState(false);

  const user = useAuthStore((s) => s.user);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const toggleReactionLocal = useChatStore((s) => s.toggleReactionLocal);
  const toggleBookmarkLocal = useChatStore((s) => s.toggleBookmarkLocal);

  const codeRef = useRef();

    useEffect(() => {
      Prism.highlightAll();
    }, [message]);
  /* ================= GROUP REACTIONS ================= */
  const groupedReactions = Object.values(
    (message.reactions || []).reduce((acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      acc[r.emoji].count++;
      acc[r.emoji].users.push(r.user);
      return acc;
    }, {})
  );

  /* ================= REACTION ================= */
  const handleReaction = async (emoji) => {
    if (!user) return;

    toggleReactionLocal(message._id, emoji, user._id);

    try {
      const res = await addReaction(message._id, emoji);
      updateMessage({
          ...res.data,
          sender: message.sender, //  keep sender
        });

    } catch (err) {
      console.error(err);
    }
  };

  /* ================= PIN ================= */
  const handlePin = async () => {
  const updated = { ...message, pinned: !message.pinned };

  //  optimistic UI
  updateMessage(updated);

  try {
    const res = message.pinned
      ? await unpinMessage(message._id)
      : await pinMessage(message._id);

    //  fallback if backend sends full message
    if (res?.data?._id) {
      updateMessage({
        ...res.data,
        sender: message.sender, //  preserve sender
      });
    }

  } catch (err) {
    console.error("Pin failed:", err);

    //  revert on error
    updateMessage(message);
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
    toggleBookmarkLocal(message._id);

    try {
      const res = await toggleBookmark(message._id);

      updateMessage({
        ...message,
        bookmarked: res.data.bookmarked,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex gap-3 group hover:bg-gray-100 p-3 rounded-lg relative">

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center">
        {message?.sender?.name?.[0] || "U"}
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
          {message?.bookmarked && (
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
          <p className="text-sm break-words">
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
                <p className="text-sm break-words">
                  {renderContent(message.content)}
                </p>
              )}

          </p>

        )}

        {/* Reactions */}
        <div className="flex gap-2 mt-2">
          {groupedReactions.map((r, i) => {
            const isMine = r.users.includes(user?._id);

            return (
              <button
                key={i}
                onClick={() => handleReaction(r.emoji)}
                className={`text-xs px-2 py-1 rounded border ${
                  isMine
                    ? "bg-blue-100 border-blue-400"
                    : "bg-gray-200"
                }`}
              >
                {r.emoji} {r.count}
              </button>
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
          {message?.bookmarked ? <BookmarkX size={16} /> : <Bookmark size={16} />}
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

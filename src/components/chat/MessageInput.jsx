import { useState, useRef, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import EmojiPicker from "emoji-picker-react";
import {
  Paperclip,
  Smile,
  AtSign,
  Code,
  Send,
  X,
  FileIcon,
  Loader2,
} from "lucide-react";

import api from "../../api/axios";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import { sendMessage, uploadFile } from "../../services/messageService";
import socket from "../../socket/socket";


/* ================= MAIN ================= */
export default function MessageInput({
  isThread = false,
  onSendOverride,
  parentMessageId,
  replyTo,
}) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [users, setUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const user = useAuthStore((s) => s.user);



  const { addMessage, activeChannel, dmUser, isDM } = useChatStore();
  const fileInputRef = useRef();

  useEffect(() => {
  if (!activeChannel?._id || isDM) return;

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/channels/${activeChannel._id}/members`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchUsers();
}, [activeChannel, isDM]);

/* ================= HANDLE INPUT ================= */
const handleChange = (value) => {
  setText(value);

  /* ================= MENTION LOGIC ================= */
  const match = value.match(/@(\w*)$/);

  if (match) {
    setShowMention(true);
    setMentionQuery(match[1].toLowerCase());
    setMentionIndex(0);
  } else {
    setShowMention(false);
  }

  /* ================= TYPING EMIT ================= */
  if (!user?.name) return;

  const payload = {
    user: user.name,
    channelId: activeChannel?._id,
    receiverId: dmUser?._id,
    isDM,
  };

  socket.emit("typing", payload);

  // clear previous timeout
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  // stop typing after delay
  typingTimeoutRef.current = setTimeout(() => {
    socket.emit("stop_typing", payload);
  }, 1500);
};

/* ================= FILTER USERS ================= */
const filteredUsers = users.filter((u) =>
  u.name.toLowerCase().includes(mentionQuery)
);

/* ================= SELECT MENTION ================= */
const selectMention = (user) => {
  const newText = text.replace(/@(\w*)$/, `@${user.name} `);
  setText(newText);
  setShowMention(false);
};

/* ================= KEY HANDLING ================= */
const handleKeyPress = (e) => {
  if (showMention) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) =>
        i < filteredUsers.length - 1 ? i + 1 : i
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => (i > 0 ? i - 1 : 0));
      return;
    }

    if (e.key === "Enter") {
      if (filteredUsers[mentionIndex]) {
        e.preventDefault();
        selectMention(filteredUsers[mentionIndex]);
        return;
      }
    }
  }

  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};


  /* ================= FILE HANDLING ================= */
  const handleFileSelection = (files) => {
    const newFiles = Array.from(files).map((file) => ({
      file,
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      progress: 0,
    }));

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  /* ================= DRAG DROP ================= */
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelection(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  /* ================= SEND ================= */
  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;

    setIsSending(true);

    try {
      let uploadedUrls = [];

      if (attachments.length > 0) {
        const results = await Promise.all(
          attachments.map((a) =>
            uploadFile(a.file, (progress) => {
              setAttachments((prev) =>
                prev.map((item) =>
                  item.id === a.id ? { ...item, progress } : item
                )
              );
            })
          )
        );

        uploadedUrls = results.map((r) => r.data.url);
      }

      const payload = {
        content: text,
        files: uploadedUrls,
        parentMessage: parentMessageId,
        ...(isDM
          ? { receiverId: dmUser._id }
          : { channelId: activeChannel._id }),
      };

      //  THREAD MODE
      if (isThread && onSendOverride) {
        await onSendOverride(payload);
      } else {
        await sendMessage(payload);
      }

      setText("");
      setAttachments([]);

    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };



  if (!activeChannel && !isDM) return null;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="fixed bottom-0 left-0 w-full flex justify-center px-4"
    >
      <div className="w-full max-w-3xl bg-white border shadow-2xl rounded-2xl overflow-hidden relative">

        {/* DRAG OVERLAY */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100/80 flex items-center justify-center text-blue-600 font-medium text-lg z-50">
            Drop files here 📂
          </div>
        )}

        {/* ================= ATTACHMENTS ================= */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 p-3 border-b bg-gray-50">
            {attachments.map((at) => (
              <div
                key={at.id}
                className="relative group w-24 h-24 border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                {/* IMAGE */}
                {at.type.startsWith("image/") && (
                  <img
                    src={at.preview}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreview(at.preview)}
                  />
                )}

                {/* VIDEO */}
                {at.type.startsWith("video/") && (
                  <video
                    src={URL.createObjectURL(at.file)}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}

                {/* AUDIO */}
                {at.type.startsWith("audio/") && (
                  <div className="p-2 flex items-center justify-center h-full">
                    <audio controls src={URL.createObjectURL(at.file)} />
                  </div>
                )}

                {/* FILE */}
                {!at.type.startsWith("image/") &&
                  !at.type.startsWith("video/") &&
                  !at.type.startsWith("audio/") && (
                    <div className="flex flex-col items-center justify-center h-full p-1">
                      <FileIcon size={20} />
                      <span className="text-[10px] truncate">
                        {at.name}
                      </span>
                    </div>
                  )}

                {/* PROGRESS BAR */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                  <div
                    className="h-1 bg-blue-500"
                    style={{ width: `${at.progress}%` }}
                  />
                </div>

                {/* REMOVE */}
                <button
                  onClick={() => removeAttachment(at.id)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ================= INPUT ================= */}
        <div className="px-3 py-2">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                replyTo
                  ? `Replying to ${replyTo?.sender?.name}: "${replyTo?.content?.slice(0, 30)}"`
                  : isDM
                  ? `Message ${dmUser?.name}`
                  : `Message #${activeChannel?.name}`
              }

              className="flex-1 resize-none outline-none text-sm px-3 py-2 max-h-40"
            />


            <button
              onClick={handleSend}
              disabled={isSending}
              className="p-2 rounded-xl bg-blue-600 text-white"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          {showMention && filteredUsers.length > 0 && (
          <div className="absolute bottom-20 left-4 w-60 bg-white border shadow-xl rounded-xl z-50 max-h-60 overflow-y-auto">
            {filteredUsers.map((u, i) => (
              <div
                key={u._id}
                onClick={() => selectMention(u)}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                  i === mentionIndex ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                <img
                  src={u.avatar}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm">{u.name}</span>
              </div>
            ))}
          </div>
        )}


          {/* ACTIONS */}
          <div className="flex items-center gap-1 mt-2 border-t pt-2">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleFileSelection(e.target.files)}
            />

            <IconButton onClick={() => fileInputRef.current.click()}>
              <Paperclip size={18} />
            </IconButton>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Smile size={18} />
                </button>
              </Popover.Trigger>
              <Popover.Content side="top">
                <EmojiPicker
                  onEmojiClick={(e) =>
                    setText((prev) => prev + e.emoji)
                  }
                />
              </Popover.Content>
            </Popover.Root>

            <IconButton onClick={() => setText((p) => p + "@")}>
              <AtSign size={18} />
            </IconButton>

            <IconButton onClick={() => setText((p) => p + "\n```\n\n```")}>
              <Code size={18} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* 🔥 IMAGE PREVIEW MODAL */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <img src={preview} className="max-h-[80%] rounded-xl" />
        </div>
      )}
    </div>
  );
}

/* ================= BUTTON ================= */
function IconButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 hover:bg-gray-100 rounded-lg"
    >
      {children}
    </button>
  );
}

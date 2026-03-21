import { useState, useRef, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import EmojiPicker from "emoji-picker-react";
import {
  Paperclip,
  Smile,
  AtSign,
  Code,
  Send,
} from "lucide-react";

import api from "../../api/axios";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import { sendMessage } from "../../services/messageService"; 
import { uploadFile } from "../../services/messageService";
import socket from "../../socket/socket";

export default function MessageInput() {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [users, setUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const { addMessage } = useChatStore.getState();
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { activeChannel, dmUser, isDM } = useChatStore();
  const user = useAuthStore((s) => s.user);

  /* ================= FETCH USERS (ONLY CHANNEL) ================= */
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

  /* ================= FILE UPLOAD ================= */
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setPreview(null);
    }
  };

  /* ================= DRAG DROP ================= */
  const handleDrop = async (e) => {
    e.preventDefault();

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    setIsSending(true);

    try {
      const res = await uploadFile(droppedFile);
      const fileUrl = res.data.url;

      await handleSend(fileUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  /* ================= INPUT CHANGE ================= */
  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (isDM) return; // ❌ no mentions in DM

    const lastWord = value.split(" ").pop();
    setShowMention(lastWord.startsWith("@"));
  };

  /* ================= TYPING ================= */
  const emitTyping = () => {
    if (isDM) {
      socket.emit("typing_dm", {
        toUserId: dmUser._id,
        user: user.name,
      });
    } else {
      socket.emit("typing", {
        channelId: activeChannel._id,
        user: user.name,
      });
    }

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isDM) {
        socket.emit("stop_typing_dm", {
          toUserId: dmUser._id,
        });
      } else {
        socket.emit("stop_typing", {
          channelId: activeChannel._id,
        });
      }
    }, 1500);
  };

  /* ================= SEND MESSAGE ================= */
const handleSend = async () => {
  if (!text.trim()) return;

  try {
    const payload = isDM
      ? {
          receiverId: dmUser._id,
          content: text,
        }
      : {
          channelId: activeChannel._id,
          content: text,
        };

    const res = await sendMessage(payload);

    addMessage(res.data);

    setText("");
  } catch (err) {
    console.error(err);
  }
};




  /* ================= ENTER ================= */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeChannel && !isDM) return null;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="absolute bottom-4 left-0 w-full flex justify-center px-4"
    >
      <div className="w-full max-w-3xl bg-white border shadow-xl rounded-2xl px-3 py-2">

        {/* FILE PREVIEW */}
        {file && (
          <div className="mb-2 p-2 border rounded-lg flex items-center gap-2">
            {preview ? (
              <img src={preview} className="w-16 h-16 object-cover rounded" />
            ) : (
              <div className="text-sm">{file.name}</div>
            )}
          </div>
        )}

        {/* INPUT */}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => {
              handleChange(e);
              emitTyping();
            }}
            onKeyDown={handleKeyPress}
            placeholder={
              isDM
                ? `Message ${dmUser?.name}`
                : `Message #${activeChannel?.name}`
            }
            rows={1}
            className="flex-1 resize-none outline-none text-sm px-3 py-2 max-h-28"
          />

          <button
            onClick={() => handleSend()}
            className="p-2 rounded-xl bg-blue-500 text-white"
          >
            <Send size={18} />
          </button>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => fileInputRef.current.click()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <Popover.Root>
            <Popover.Trigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Smile size={18} />
              </button>
            </Popover.Trigger>

            <Popover.Content className="bg-white shadow-xl rounded-xl border p-2">
              <EmojiPicker
                onEmojiClick={(e) =>
                  setText((prev) => prev + e.emoji)
                }
              />
            </Popover.Content>
          </Popover.Root>

          {!isDM && (
            <button
              onClick={() => setText((prev) => prev + "@")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <AtSign size={18} />
            </button>
          )}

          <button
            onClick={() =>
              setText((prev) => prev + "\n```\ncode here\n```\n")
            }
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Code size={18} />
          </button>
        </div>
      </div>

      {/* MENTION DROPDOWN */}
      {!isDM && showMention && (
        <div className="absolute bottom-24 w-64 bg-white border shadow-xl rounded-xl z-50">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                setText((prev) =>
                  prev.replace(/@\w*$/, `@${u.username || u.name} `)
                );
                setShowMention(false);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {u.username || u.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

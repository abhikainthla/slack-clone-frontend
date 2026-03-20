import { useState, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import EmojiPicker from "emoji-picker-react";
import {
  Paperclip,
  Smile,
  AtSign,
  Code,
  Send,
} from "lucide-react";
import { useEffect } from "react";
import api from "../../api/axios";

import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import { uploadFile, sendMessage } from "../../services/messageService";
import socket from "../../socket/socket";
import Prism from "prismjs";
import "prismjs/themes/prism.css";


export default function MessageInput() {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [users, setUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);



  const fileInputRef = useRef(null);

  const activeChannel = useChatStore((s) => s.activeChannel);
  const user = useAuthStore((s) => s.user);

useEffect(() => {
  if (!activeChannel?._id) return; 

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/channels/${activeChannel._id}/members`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchUsers();
}, [activeChannel]); 


  /* ================= FILE UPLOAD ================= */
  const handleFileUpload = (e) => {
  const selectedFile = e.target.files[0];
  if (!selectedFile) return;

  setFile(selectedFile);

  // preview (only for images)
  if (selectedFile.type.startsWith("image/")) {
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  } else {
    setPreview(null);
  }
};




  const handleDrop = async (e) => {
  e.preventDefault();

  const file = e.dataTransfer.files[0];
  if (!file || !activeChannel) return;

  setIsSending(true);

  try {
    const res = await uploadFile(file);
    const fileUrl = res.data.url;

    const tempMessage = {
      _id: Date.now(),
      content: fileUrl,
      sender: user,
      createdAt: new Date().toISOString(),
      reactions: [],
    };

    useChatStore.getState().setMessages((prev) => [...prev, tempMessage]);

    const msgRes = await sendMessage({
      channelId: activeChannel._id,
      content: fileUrl,
    });

    socket.emit("send_message", {
      channelId: activeChannel._id,
      message: {
        ...msgRes.data,
        sender: user,
      },
    });

  } catch (err) {
    console.error(err);
  } finally {
    setIsSending(false);
  }
};


const handleDragOver = (e) => {
  e.preventDefault();
};


  const handleChange = (e) => {
  const value = e.target.value;
  setText(value);

  const lastWord = value.split(" ").pop();

  if (lastWord.startsWith("@")) {
    setShowMention(true);
  } else {
    setShowMention(false);
  }
};


const handleSlashCommand = async () => {
  if (text.startsWith("/giphy")) {
    const query = text.replace("/giphy", "").trim();

    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=YOUR_KEY&q=${query}&limit=1`
    );
    const data = await res.json();

    const gif = data.data[0]?.images?.original?.url;

    if (gif) {
      await sendMessage({
        channelId: activeChannel._id,
        content: gif,
      });
    }

    setText("");
    return true;
  }

  if (text.startsWith("/poll")) {
    const poll = text.replace("/poll", "").trim();

    await sendMessage({
      channelId: activeChannel._id,
      content: `📊 Poll: ${poll}`,
    });

    setText("");
    return true;
  }

  return false;
};


  /* ================= SEND MESSAGE ================= */
  const handleSend = async () => {
  if ((!text.trim() && !file) || !activeChannel || isSending) return;

  setIsSending(true);

  try {
    let content = text;

    // ✅ if file exists → upload first
    if (file) {
      const res = await uploadFile(file);
      content = res.data.url;
    }

    const tempId = Date.now();

      const tempMessage = {
        _id: tempId,
        tempId,
        content,
        sender: {
          _id: user._id,
          name: user.name,
        },
        createdAt: new Date().toISOString(),
        reactions: [],
      };

      useChatStore.getState().setMessages((prev) => [...prev, tempMessage]);

    const res = await sendMessage({
      channelId: activeChannel._id,
      content,
    });

    socket.emit("send_message", {
      channelId: activeChannel._id,
      message: {
        ...res.data,
        tempId, 
        sender: {
          _id: user._id,
          name: user.name,
        },
      },
    })

    // reset
    setText("");
    setFile(null);
    setPreview(null);

  } catch (err) {
    console.error(err);
  } finally {
    setIsSending(false);
  }
};



const typingTimeoutRef = useRef(null);


const emitTyping = () => {
  socket.emit("typing", {
    channelId: activeChannel._id,
    user: user.name,
  });

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  typingTimeoutRef.current = setTimeout(() => {
    socket.emit("stop_typing", {
      channelId: activeChannel._id,
      user: user.name,
    });
  }, 1500);
};




  /* ================= ENTER SEND ================= */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeChannel) return null;

  return (
    <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="absolute bottom-4 left-0 w-full flex justify-center px-4"
      >
        <div className="w-full max-w-3xl bg-white border shadow-xl  rounded-2xl px-3 py-2">

          {/* INPUT ROW */}
          <div className="flex items-end gap-2">
            {file && (
              <div className="mb-2 p-2 border rounded-lg flex items-center gap-2">
                {preview ? (
                  <img src={preview} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="text-sm">{file.name}</div>
                )}

                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="text-red-500 text-xs"
                >
                  Remove
                </button>
              </div>
            )}


            {/* TEXTAREA */}
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleChange(e);
                emitTyping();
              }}
              onKeyDown={handleKeyPress}
              placeholder={`Message #${activeChannel.name}`}
              rows={1}
              className="flex-1 resize-none outline-none text-sm px-3 py-2 max-h-28"
              disabled={isSending}
            />

            {/* SEND */}
            <button
              onClick={handleSend}
              disabled={(!text.trim() && !file) || isSending}
              className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300"
            >
              <Send size={18} />
            </button>
          </div>

          {/* ACTION ROW */}
          <div className="flex items-center gap-2 mt-2">

            {/* FILE */}
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

            {/* EMOJI */}
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Smile size={18} />
                </button>
              </Popover.Trigger>

              <Popover.Content
                side="top"
                className="bg-white shadow-xl rounded-xl border p-2"
              >
                <EmojiPicker
                  onEmojiClick={(e) =>
                    setText((prev) => prev + e.emoji)
                  }
                />
              </Popover.Content>
            </Popover.Root>

            {/* MENTION */}
            <button
              onClick={() => setText((prev) => prev + "@")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <AtSign size={18} />
            </button>

            {/* CODE */}
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
        {showMention && (
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

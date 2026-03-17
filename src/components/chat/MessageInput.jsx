import { useState } from "react";
import useChatStore from "../../store/chatStore";
import { sendMessage } from "../../services/messageService";
import socket from "../../socket/socket";

export default function MessageInput() {
  const [text, setText] = useState("");

  const activeChannel = useChatStore((s) => s.activeChannel);

  const handleSend = async () => {
    if (!text || !activeChannel) return;

    const res = await sendMessage({
      channelId: activeChannel._id,
      text,
    });

    socket.emit("send_message", {
      channelId: activeChannel._id,
      message: res.data,
    });

    setText("");
  };

  return (
    <div className="border-t p-4 bg-white">

      <div className="flex items-center border rounded-lg px-4 py-2">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          type="text"
          placeholder={
            activeChannel
              ? `Message #${activeChannel.name}`
              : "Select a channel"
          }
          className="flex-1 outline-none"
        />

        <button onClick={handleSend} className="text-blue-500">
          ➤
        </button>

      </div>

    </div>
  );
}

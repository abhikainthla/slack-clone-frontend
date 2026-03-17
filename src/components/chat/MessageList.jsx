import { useEffect } from "react";
import MessageItem from "./MessageItem";
import useChatStore from "../../store/chatStore";
import { getMessages } from "../../services/messageService";
import socket from "../../socket/socket";

export default function MessageList() {
  const activeChannel = useChatStore((s) => s.activeChannel);
  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);

  useEffect(() => {
    if (!activeChannel) return;

    const fetchMessages = async () => {
      const res = await getMessages(activeChannel._id);
      setMessages(res.data);
    };

    fetchMessages();

    socket.connect();
    socket.emit("join_channel", activeChannel._id);

    socket.on("receive_message", (msg) => {
      addMessage(msg);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [activeChannel]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {!activeChannel && (
        <p className="text-gray-400">Select a channel</p>
      )}

      {messages.map((msg) => (
        <MessageItem key={msg._id} message={msg} />
      ))}

    </div>
  );
}

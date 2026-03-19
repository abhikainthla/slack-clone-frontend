import { useEffect, useRef, useState } from "react";
import { getMessages } from "../../services/messageService";
import useChatStore from "../../store/chatStore";
import MessageItem from "./MessageItem";
import socket from "../../socket/socket";
import { MessageCircleWarning } from "lucide-react";

export default function MessageList() {
  const { activeChannel, messages, setMessages } = useChatStore();
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);

useEffect(() => {
  socket.on("typing", ({ user }) => {
    setTypingUsers((prev) => [...new Set([...prev, user])]);

    setTimeout(() => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    }, 2000);
  });

  return () => socket.off("typing");
}, []);


  /* ================= FETCH MESSAGES ================= */

  useEffect(() => {
  socket.on("receive_message", (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  });

  return () => socket.off("receive_message");
}, [setMessages]);


  useEffect(() => {
    if (!activeChannel?._id) return;

    const fetchMessages = async () => {
      try {
        const res = await getMessages(activeChannel._id);

        //  backend sends latest first → reverse
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.messages || [];

        setMessages(data.reverse());

      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [activeChannel, setMessages]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages]);

  return (
  <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-3 bg-gray-50 overscroll-contain">
    {messages?.length > 0 ? (
      Array.isArray(messages) &&
      messages.map((msg) =>
        msg?._id ? <MessageItem key={msg._id} message={msg} /> : null
      )
    ) : (
        <div className="flex items-center justify-center h-full w-full">
          <p className="flex items-center gap-2 text-gray-400 text-sm">
            <MessageCircleWarning size={18} />
            Choose a channel or dm 
          </p>
        </div>

    )}

    {/* Typing indicator */}
    {typingUsers.length > 0 && (
      <p className="text-xs text-gray-400 px-2">
        {typingUsers.join(", ")} typing...
      </p>
    )}

    <div ref={messagesEndRef} />
  </div>
);

}

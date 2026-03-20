import { useEffect, useRef, useState } from "react";
import { getMessages, markAsRead } from "../../services/messageService";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import MessageItem from "./MessageItem";
import socket from "../../socket/socket";
import { MessageCircleWarning } from "lucide-react";

export default function MessageList() {
  const { activeChannel, messages, setMessages } = useChatStore();
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
  if (!activeChannel?._id) return;

  socket.emit("join_channel", activeChannel._id);

  return () => {
    socket.emit("leave_channel", activeChannel._id);
  };
}, [activeChannel]);


useEffect(() => {
  const handleTyping = (user) => {
    const currentUser = useAuthStore.getState().user?.name;
    if (user === currentUser) return;

    setTypingUsers((prev) => {
      if (prev.includes(user)) return prev;
      return [...prev, user];
    });
  };

  const handleStopTyping = (user) => {
    setTypingUsers((prev) => prev.filter((u) => u !== user));
  };

  socket.on("user_typing", handleTyping);
  socket.on("user_stop_typing", handleStopTyping);

  return () => {
    socket.off("user_typing", handleTyping);
    socket.off("user_stop_typing", handleStopTyping);
  };
}, []);





  /* ================= FETCH MESSAGES ================= */

  useEffect(() => {
  const handler = (newMessage) => {
    setMessages((prev) => {
      //  replace temp message if exists
      const tempIndex = prev.findIndex(
        (m) => m.tempId && m.tempId === newMessage.tempId
      );

      if (tempIndex !== -1) {
        const updated = [...prev];
        updated[tempIndex] = newMessage;
        return updated;
      }

      // prevent duplicates
      const exists = prev.find((m) => m._id === newMessage._id);
      if (exists) return prev;

      return [...prev, newMessage];
    });
  };

  socket.on("receive_message", handler);

  return () => socket.off("receive_message", handler);
}, []);

useEffect(() => {
  if (!messages.length || !activeChannel?._id) return;

  const lastMessage = messages[messages.length - 1];
  const user = useAuthStore.getState().user;

  // API call (DB update)
  markAsRead(activeChannel._id, lastMessage._id);

  //  SOCKET EVENT (REAL-TIME)
  socket.emit("message_read", {
    messageId: lastMessage._id,
    userId: user._id,
  });

}, [messages]);


useEffect(() => {
    const handleRead = ({ messageId, userId }) => {
    const state = useChatStore.getState();
    const msg = state.messages.find((m) => m._id === messageId);

    if (!msg) return;

    const alreadyExists = msg.readBy?.some(
      (r) => r.user === userId
    );

    if (alreadyExists) return;

    state.updateMessage({
      _id: messageId,
      readBy: [...(msg.readBy || []), { user: userId }],
    });
  };


  socket.on("message_read_update", handleRead);

  return () => socket.off("message_read_update", handleRead);
}, []);




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

  const renderTypingText = () => {
  if (typingUsers.length === 0) return null;

  if (typingUsers.length === 1) {
    return `${typingUsers[0]} is typing...`;
  }

  if (typingUsers.length === 2) {
    return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
  }

  return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
};


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
    <div className="flex items-center gap-2 px-2 text-gray-400 text-sm">
      <span>{renderTypingText()}</span>

      {/* Animated dots */}
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )}



    <div ref={messagesEndRef} />
  </div>
);

}

import { useEffect, useRef, useState } from "react";
import { getMessages, markAsRead } from "../../services/messageService";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import MessageItem from "./MessageItem";
import socket from "../../socket/socket";
import { MessageCircleWarning } from "lucide-react";

export default function MessageList({ messageRefs }) {
  const { activeChannel, messages, setMessages, dmUser, isDM } = useChatStore();
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);

  /* ================= JOIN ROOMS ================= */
  useEffect(() => {
    if (activeChannel?._id) {
      socket.emit("join_channel", activeChannel._id);

      return () => {
        socket.emit("leave_channel", activeChannel._id);
      };
    }

    if (isDM && dmUser?._id) {
      socket.emit("join_dm", dmUser._id);
    }
  }, [activeChannel, isDM, dmUser]);

  /* ================= SOCKET: MESSAGES (CHANNEL + DM) ================= */
  useEffect(() => {
    const handler = (newMessage) => {
      setMessages((prev) => {
        const map = new Map();

        prev.forEach((m) => map.set(m._id || m.tempId, m));

        if (newMessage.tempId) {
          map.set(newMessage.tempId, newMessage);
        }

        map.set(newMessage._id, newMessage);

        return Array.from(map.values());
      });
    };

    socket.on("receive_message", handler);
    socket.on("receive_dm", handler);

    return () => {
      socket.off("receive_message", handler);
      socket.off("receive_dm", handler);
    };
  }, [setMessages]);

  /* ================= SOCKET: READ RECEIPTS ================= */
  useEffect(() => {
    const handleRead = ({ messageId, userId }) => {
      const state = useChatStore.getState();
      const msg = state.messages.find((m) => m._id === messageId);

      if (!msg) return;

      const alreadyExists = msg.readBy?.some(
        (r) => (r.user?._id || r.user)?.toString() === userId
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

  /* ================= SOCKET: TYPING ================= */
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
    const fetchMessages = async () => {
      try {
        let res;

        if (isDM && dmUser?._id) {
          res = await getMessages({ userId: dmUser._id });
        } else if (activeChannel?._id) {
          res = await getMessages({ channelId: activeChannel._id });
        } else {
          return;
        }

        const data = Array.isArray(res.data)
          ? res.data
          : res.data.messages || [];

        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [activeChannel, dmUser, isDM, setMessages]);

  useEffect(() => {
  const handleReactionUpdate = ({ messageId, reactions }) => {
    useChatStore.getState().updateMessage({
      _id: messageId,
      reactions,
    });
  };

  const handlePinUpdate = ({ messageId, pinned }) => {
    useChatStore.getState().updateMessage({
      _id: messageId,
      pinned,
    });
  };

  socket.on("reaction_update", handleReactionUpdate);
  socket.on("pin_update", handlePinUpdate);

  return () => {
    socket.off("reaction_update", handleReactionUpdate);
    socket.off("pin_update", handlePinUpdate);
  };
}, []);


  /* ================= MARK AS READ ================= */
  useEffect(() => {
    if (!messages.length) return;

    const user = useAuthStore.getState().user;

    const unread = messages.filter(
      (m) =>
        !m.readBy?.some(
          (r) =>
            (r.user?._id || r.user)?.toString() === user._id.toString()
        )
    );

    if (!unread.length) return;

    const lastUnread = unread[unread.length - 1];

    const timeout = setTimeout(() => {
      markAsRead(lastUnread._id);
    }, 500);

    return () => clearTimeout(timeout);
  }, [messages]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= TYPING TEXT ================= */
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

  /* ================= UI ================= */
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-3 bg-gray-50">

      {messages?.length > 0 ? (
        messages.map((msg) =>
          msg?._id ? (
            <div
              key={`${msg._id}-${msg.createdAt}`}
              ref={(el) => (messageRefs.current[msg._id] = el)}
            >
              <MessageItem message={msg} />
            </div>
          ) : null
        )
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <p className="flex items-center gap-2 text-gray-400 text-sm">
            <MessageCircleWarning size={18} />
            Choose a channel or DM
          </p>
        </div>
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 px-2 text-gray-400 text-sm">
          <span>{renderTypingText()}</span>

          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-300" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

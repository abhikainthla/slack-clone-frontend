import { useEffect, useRef, useState } from "react";
import { getMessages, markAsRead, markChannelRead } from "../../services/messageService";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import MessageItem from "./MessageItem";
import socket from "../../socket/socket";
import { MessageCircleWarning } from "lucide-react";


export default function MessageList({ messageRefs, loading }){
  const { activeChannel, messages, setMessages, dmUser, isDM } = useChatStore();
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
    const user = useAuthStore((s) => s.user);
    

  /* ================= JOIN ROOMS ================= */
  useEffect(() => {
    if (activeChannel?._id) {
      socket.emit("join_channel", activeChannel._id);

      return () => {
        socket.emit("leave_channel", activeChannel._id);
      };
    }

    if (isDM && dmUser?._id && user?._id) {
      socket.emit("join_user", user._id);
    }
  }, [activeChannel, isDM, dmUser, user]);


  /* ================= SOCKET: MESSAGES (CHANNEL + DM) ================= */
  useEffect(() => {
    const handler = (newMessage) => {
      const { activeChannel, dmUser, isDM } = useChatStore.getState();

      //  CHANNEL FILTER
      if (activeChannel?._id && newMessage.channel !== activeChannel._id) {
        return;
      }

      //  DM FILTER
      if (isDM) {
        const participants = [
          newMessage?.sender?._id || newMessage?.sender,
          ...(newMessage?.conversation?.members || []),
        ]
        .filter(Boolean)
        .map((id) => id?.toString());

        if (!participants.includes(dmUser?._id?.toString())) {
          return; // ignore other DMs
        }
      }

      setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
              if (exists) return prev;
              return [...prev, newMessage];
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

useEffect(() => {
  if (!activeChannel?._id || messages.length === 0) return;

  const lastMessage = messages[messages.length - 1];

  const timer = setTimeout(() => {
    useChatStore.getState().setChannels((channels) =>
      channels.map((ch) =>
        ch._id === activeChannel._id
          ? { ...ch, unreadCount: 0 }
          : ch
      )
    );

    markChannelRead(activeChannel._id, lastMessage._id);
  }, 500);

  return () => clearTimeout(timer);
}, [activeChannel?._id]);




useEffect(() => {
  const el = messagesEndRef.current;
  if (!el) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (activeChannel?._id && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];

          // ✅ optimistic update
          useChatStore.getState().setChannels((channels) =>
            channels.map((ch) =>
              ch._id === activeChannel._id
                ? { ...ch, unreadCount: 0 }
                : ch
            )
          );

          markChannelRead(activeChannel._id, lastMessage._id);
        }
      }
    },
    { threshold: 1 }
  );

  observer.observe(el);
  return () => observer.disconnect();
}, [messages, activeChannel]);





  /* ================= SOCKET: TYPING ================= */
  useEffect(() => {
    const handleTyping = (username) => {
      const currentUser = useAuthStore.getState().user?.name;
      if (username === currentUser) return;

      setTypingUsers((prev) => {
        if (prev.includes(username)) return prev;
        return [...prev, username];
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
    if (!messages?.length) return;

    const user = useAuthStore.getState().user;
    if (!user?._id) return;

    const unread = messages.filter((m) => {
      if (!m?._id) return false;

      const readBy = Array.isArray(m.readBy) ? m.readBy : [];

      const isRead = readBy.some((r) => {
        if (!r) return false;

        const id =
          typeof r.user === "object"
            ? r.user?._id
            : r.user;

        return id?.toString() === user?._id?.toString();
      });

      return !isRead;
    });

    if (!unread.length) return;

    const lastUnread = unread[unread.length - 1];
    if (!lastUnread?._id) return;

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
    <div className="flex flex-col flex-1 min-w-0 bg-gray-50 p-4 pb-28 space-y-3">

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

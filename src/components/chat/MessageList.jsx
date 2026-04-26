import { useEffect, useRef, useState } from "react";
import { getMessages, markAsRead, markChannelRead } from "../../services/messageService";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import MessageItem from "./MessageItem";
import socket from "../../socket/socket";
import { MessageCircleWarning } from "lucide-react";
import api from "../../api/axios";



export default function MessageList({ messageRefs, loading }){
  const { activeChannel, messages, setMessages, dmUser, isDM } = useChatStore();
  const threadMessage = useChatStore((s) => s.threadMessage);
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const user = useAuthStore((s) => s.user);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef();
  const prevHeightRef = useRef(0);
  const stateRef = useRef();

  useEffect(() => {
    stateRef.current = {
      loadingMore,
      hasMore,
      messages,
      activeChannel,
      dmUser,
      isDM,
    };
  });






const debouncedLoadMore = useRef();

useEffect(() => {
  let timer;

  const loadMore = async () => {
    const state = stateRef.current;

    if (!state || state.loadingMore || !state.hasMore || state.messages.length === 0) return;

    try {
      prevHeightRef.current = containerRef.current?.scrollHeight || 0;
      setLoadingMore(true);

      const oldest = state.messages[0];

      let res;

      if (state.isDM && state.dmUser?._id) {
        res = await getMessages({
          userId: state.dmUser._id,
          before: oldest?._id,
        });
      } else if (state.activeChannel?._id) {
        res = await getMessages({
          channelId: state.activeChannel._id,
          before: oldest?._id,
        });
      }

      const newMsgs = res?.data?.messages || res?.data || [];

      if (!newMsgs.length) {
        setHasMore(false);
        return;
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id));
        const filtered = newMsgs.filter((m) => !existingIds.has(m._id));
        return [...filtered, ...prev];
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  debouncedLoadMore.current = () => {
    clearTimeout(timer);
    timer = setTimeout(loadMore, 300);
  };

  return () => clearTimeout(timer);
}, []); 


useEffect(() => {
  if (!containerRef.current) return;

  const newHeight = containerRef.current.scrollHeight;
  const diff = newHeight - prevHeightRef.current;

  if (diff > 0) {
    containerRef.current.scrollTop += diff;
  }
}, [messages]);


    

  /* ================= JOIN ROOMS ================= */
  useEffect(() => {
    if (activeChannel?._id) {
      socket.emit("join_channel", activeChannel._id);

      return () => {
        socket.emit("leave_channel", activeChannel._id);
      };
    }

    if (isDM && dmUser?._id) {
      socket.emit("join_user", dmUser._id);
    }

  }, [activeChannel, isDM, dmUser, user]);


  /* ================= SOCKET: MESSAGES (CHANNEL + DM) ================= */
  useEffect(() => {
    const handler = (newMessage) => {
      const { activeChannel, dmUser, isDM } = useChatStore.getState();
      if (newMessage.parentMessage) return;
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
        if (prev.some((m) => m._id === newMessage._id)) return prev;
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
  if (!lastMessage?._id) return;

  // mark read ONCE when messages load/change
  markChannelRead(activeChannel._id, lastMessage._id);

}, [activeChannel?._id, messages.length]);






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

          
          await api.post(`/messages/read/dm/${dmUser._id}`);
          socket.emit("dm_read", { userId: dmUser._id });

          const fetchThreadUnread = async (messageId) => {
            const res = await api.get(`/messages/thread/unread/${messageId}`);
            useChatStore.getState().setThreadUnread(messageId, res.data.count);
          };



        } else if (activeChannel?._id) {
          res = await getMessages({ channelId: activeChannel._id });
        } else {
          return;
        }

        const data = Array.isArray(res.data)
          ? res.data
          : res.data.messages || [];

        const rootMessages = data.filter((m) => !m.parentMessage);
        setMessages(rootMessages);

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

const handleScroll = (e) => {
  if (e.target.scrollTop <= 10) {
    debouncedLoadMore.current?.();
  }
};




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

  useEffect(() => {
  const handleChannelRead = ({ channelId, userId, messageId }) => {
    const state = useChatStore.getState();

    state.messages.forEach((msg) => {
      if (
        msg.channel === channelId &&
        msg._id <= messageId
      ) {
        const already = msg.readBy?.some(
          (r) =>
            (r.user?._id || r.user)?.toString() === userId
        );

        if (!already) {
          state.updateMessage({
            _id: msg._id,
            readBy: [...(msg.readBy || []), { user: userId }],
          });
        }
      }
    });
  };

  socket.on("channel_read_update", handleChannelRead);
  return () => socket.off("channel_read_update", handleChannelRead);
}, []);

useEffect(() => {
  const handleReply = (reply) => {
    if (!reply.parentMessage) return;

    const state = useChatStore.getState();

    //  store reply globally
    state.addReplyToMap(reply.parentMessage, reply);

    //  increment unread ONLY if thread is closed
    if (state.threadMessage?._id !== reply.parentMessage) {
      state.incrementThreadUnread(reply.parentMessage);
    }

    //  update parent message reply count (optimistic)
    const parentMsg = state.messages.find(
      (m) => m._id === reply.parentMessage
    );


  };

  socket.on("receive_reply", handleReply);

  return () => socket.off("receive_reply", handleReply);
}, []);

useEffect(() => {
  const handleReplyCount = ({ messageId, replyCount }) => {
    useChatStore.getState().updateMessage({
      _id: messageId,
      replyCount,
    });
  };

  socket.on("reply_count_update", handleReplyCount);

  return () => socket.off("reply_count_update", handleReplyCount);
}, []);



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
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-col flex-1 min-w-0 bg-gray-50 p-4 pb-28 space-y-3 overflow-y-auto"
      >
        {loadingMore && (
          <div className="text-center text-xs text-gray-400">
            Loading more messages...
          </div>
        )}

        <div className="relative">
          {messages?.length > 0 ? (
            messages.map((msg) => {
              const isThreadActive = !!threadMessage;
              const isFocused = threadMessage?._id === msg._id;

              return msg?._id ? (
                <div
                  key={`${msg._id}-${msg.createdAt}`}
                  ref={(el) => (messageRefs.current[msg._id] = el)}
                  className={`transition-all duration-200 ${
                    isThreadActive && !isFocused
                      ? "opacity-40 blur-[2px] scale-[0.98]"
                      : "opacity-100"
                  }`}
                >
                  <MessageItem message={msg} />
                </div>
              ) : null;
            })
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <p className="flex items-center gap-2 text-gray-400 text-sm">
                <MessageCircleWarning size={18} />
                Choose a channel or DM
              </p>
            </div>
          )}
        </div>


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

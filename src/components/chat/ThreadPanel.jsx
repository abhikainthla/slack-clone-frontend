import { useEffect } from "react";
import useChatStore from "../../store/chatStore";
import api from "../../api/axios";
import socket from "../../socket/socket";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import ThreadInput from "./ThreadInput";
import { X } from "lucide-react";

export default function ThreadPanel() {
  const {
    threadMessage,
    threadReplies,
    setThreadReplies,
    addThreadReply,
    closeThread,
  } = useChatStore();

  /* ================= FETCH REPLIES ================= */
  useEffect(() => {
    if (!threadMessage?._id) return;

    const fetchReplies = async () => {
      try {
        const res = await api.get(
          `/messages/replies/${threadMessage._id}`
        );

        // ✅ Deduplicate
        const unique = Array.from(
          new Map(res.data.map((r) => [r._id, r])).values()
        );

        setThreadReplies(unique);

        useChatStore.getState().setThreadRepliesMap(threadMessage._id, unique);

        setThreadRepliesMap: (parentId, replies) =>
          set((state) => ({
            threadRepliesMap: {
              ...state.threadRepliesMap,
              [parentId]: replies,
            },
          }))
      } catch (err) {
        console.error("❌ Failed to fetch replies:", err);
      }
    };

    fetchReplies();
  }, [threadMessage]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!threadMessage?._id) return;

    const handler = (reply) => {
      if (reply.parentMessage === threadMessage._id) {
        addThreadReply(reply); // already deduped
      }
    };

    socket.on("receive_reply", handler);

    return () => socket.off("receive_reply", handler);
  }, [threadMessage?._id]);


useEffect(() => {
  if (!threadMessage?._id) return;

  const markRead = async () => {
    try {
      await api.put(`/messages/read-message/${threadMessage._id}`);
      useChatStore.getState().clearThreadUnread(threadMessage._id);
    } catch (err) {
      console.error("Thread read error:", err);
    }
  };

  markRead();
}, [threadMessage?._id]);


  if (!threadMessage) return null;


  return (
    <div className="w-[380px] pr-5 border-l bg-white flex flex-col h-full">

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        
        {/* LEFT */}
        <div className="flex flex-col">
            <p className="font-semibold text-sm">Thread</p>
            <p className="text-xs text-gray-500 truncate max-w-[220px]">
            {threadMessage?.sender?.name}: {threadMessage?.content}
            </p>
        </div>

        {/* RIGHT */}
        <button
                onClick={closeThread}
                title="Close thread"
                className="p-2 rounded-lg hover:bg-gray-100 transition active:scale-95"
                        >
            <X size={18} />
        </button>
      </div>



      {/* PARENT */}
      <div className="border-b bg-gray-50">
        <MessageItem message={threadMessage} isThreadView={true} />
      </div>

      {/* REPLIES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {threadReplies.map((r) => (
          <MessageItem key={r._id} message={r} isThreadView={true} />
        ))}
      </div>

      {/* 🔥 REUSED INPUT */}
      <ThreadInput />
    </div>
  );
}

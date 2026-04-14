import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import useChatStore from "../../store/chatStore";
import { useEffect, useState } from "react";
import { getMessages } from "../../services/messageService";
import socket from "../../socket/socket";
import ThreadPanel from "./ThreadPanel";
import { MessageSkeleton } from "../skeletons/MessageSkeleton";



export default function ChatWindow({ messageRefs }) {
    const [loading, setLoading] = useState(false);
  const { activeChannel, dmUser, isDM, setMessages, threadMessage } =
    useChatStore();

  /* ================= JOIN DM ================= */
  useEffect(() => {
    if (isDM && dmUser?._id) {
      socket.emit("join_dm", dmUser._id);
    }
  }, [isDM, dmUser]);

  /* ================= FETCH MESSAGES ================= */
useEffect(() => {
  const fetchMessages = async () => {
    setLoading(true);
    try {
      let res;

      if (isDM && dmUser) {
        res = await getMessages({ userId: dmUser._id });
      } else if (activeChannel) {
        res = await getMessages({ channelId: activeChannel._id });
      }

      if (res?.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchMessages();
}, [activeChannel, dmUser, isDM]);


  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* MAIN CHAT AREA */}
      <div className="flex flex-col flex-1 min-w-0 bg-gray-50">
        
        {/* MESSAGE LIST */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <MessageSkeleton />
          ) : (
            <MessageList messageRefs={messageRefs} />
          )}
        </div>


        {/* INPUT */}
        <div className="border-t bg-white">
          <MessageInput />
        </div>
      </div>

      {/* THREAD PANEL (SIDEBAR) */}
      {threadMessage && (
        <div className="w-[350px] border-l bg-white flex-shrink-0">
          <ThreadPanel />
        </div>
      )}
    </div>
  );
}

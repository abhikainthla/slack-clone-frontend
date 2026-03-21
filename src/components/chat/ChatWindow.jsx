import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import useChatStore from "../../store/chatStore";
import { useEffect } from "react";
import { getMessages } from "../../services/messageService";
import socket from "../../socket/socket";

export default function ChatWindow({ messageRefs }) {
  const { activeChannel, dmUser, isDM, setMessages } = useChatStore();

useEffect(() => {
  if (isDM && dmUser?._id) {
    socket.emit("join_dm", dmUser._id);
  }
}, [isDM, dmUser]);

useEffect(() => {
  const fetchMessages = async () => {
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
      console.error("Fetch messages error:", err);
    }
  };

  fetchMessages();
}, [activeChannel, dmUser, isDM]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MessageList messageRefs={messageRefs} />
      <MessageInput />
    </div>
  );
}


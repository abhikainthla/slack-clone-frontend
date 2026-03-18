import { useEffect } from "react";
import socket from "../../socket/socket";
import useChatStore from "../../store/chatStore";

const ChatWindow = ({ channelId }) => {
  const addMessage = useChatStore((s) => s.addMessage);
  const setMessages = useChatStore((s) => s.setMessages);

  useEffect(() => {
    if (!channelId) return;

    /*  CLEAR OLD MESSAGES WHEN SWITCHING CHANNEL */
    setMessages([]);

    /*  JOIN CHANNEL */
    socket.emit("join_channel", channelId);

    /*  LISTEN FOR MESSAGES */
    const handleMessage = (message) => {
      console.log("NEW MESSAGE:", message);
      addMessage(message);
    };

    socket.on("receive_message", handleMessage);

    /*  CLEANUP (VERY IMPORTANT) */
    return () => {
      socket.emit("leave_channel", channelId); // leave previous
      socket.off("receive_message", handleMessage); // remove listener
    };
  }, [channelId, addMessage, setMessages]);

  return (
    <div className="flex flex-col h-full">

      {/*  MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* You can map messages here later */}
        Messages
      </div>

      {/*  INPUT */}
      <div className="p-4 border-t">
        Input
      </div>

    </div>
  );
};

export default ChatWindow;

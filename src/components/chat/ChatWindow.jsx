import { useEffect } from "react";
import socket from "../../socket/socket";

const ChatWindow = ({ channelId }) => {

  useEffect(() => {

    socket.emit("join_channel", channelId);

    socket.on("receive_message", (message) => {
      console.log(message);
    });

  }, [channelId]);

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-y-auto">
        Messages
      </div>

      <div className="p-4 border-t">
        Input
      </div>

    </div>
  );
};

export default ChatWindow;

import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatWindow({ messageRefs }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MessageList messageRefs={messageRefs} />
      <MessageInput />
    </div>
  );
}


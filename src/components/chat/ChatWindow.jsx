import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatWindow() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MessageList />
      <MessageInput />
    </div>
  );
}

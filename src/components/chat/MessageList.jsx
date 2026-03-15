import MessageItem from "./MessageItem";

const messages = [
  {
    user: "Alex Rivera",
    text: "Has anyone reviewed the latest design system updates?"
  },
  {
    user: "Sarah Chen",
    text: "Yes! The spacing scale improvements are significant."
  },
  {
    user: "Marcus Johnson",
    text: "I pushed a fix for the auth flow last night."
  }
];

export default function MessageList() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {messages.map((msg, index) => (
        <MessageItem key={index} message={msg} />
      ))}

    </div>
  );
}


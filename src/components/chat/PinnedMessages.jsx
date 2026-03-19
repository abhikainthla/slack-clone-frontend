import useChatStore from "../../store/chatStore";

export default function PinnedMessages() {
  const messages = useChatStore((s) => s.messages);

  const pinned = messages.filter((m) => m.pinned);

  if (!pinned.length) return null;

  return (
    <div className="border-b bg-yellow-50 p-3">
      <h3 className="text-sm font-semibold mb-2">📌 Pinned</h3>

      {pinned.map((m) => (
        <div key={m._id} className="text-sm text-gray-700">
          {m.content}
        </div>
      ))}
    </div>
  );
}

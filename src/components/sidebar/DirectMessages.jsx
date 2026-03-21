import useChatStore from "../../store/chatStore";

export default function DirectMessages() {
  const { workspace, setDM } = useChatStore();

  const members = workspace?.members || [];

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">
        DIRECT MESSAGES
      </p>

      {members.map((m) => (
        <div
          key={m.user._id}
          onClick={() => setDM(m.user)}
          className="flex justify-between px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
        >
          <span>{m.user.name}</span>
        </div>
      ))}
    </div>
  );
}

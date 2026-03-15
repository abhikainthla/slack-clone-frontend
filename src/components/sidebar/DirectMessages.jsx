const users = [
  { name: "Sarah Chen", unread: 2 },
  { name: "Marcus Johnson" },
  { name: "Emily Park" },
  { name: "David Kim", unread: 1 }
];

export default function DirectMessages() {
  return (
    <div>

      <p className="text-xs text-gray-400 mb-2">
        DIRECT MESSAGES
      </p>

      {users.map((user) => (
        <div
          key={user.name}
          className="flex justify-between px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
        >
          <span>{user.name}</span>

          {user.unread && (
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 rounded-full">
              {user.unread}
            </span>
          )}

        </div>
      ))}

    </div>
  );
}

const channels = [
  { name: "general", unread: 3 },
  { name: "engineering", unread: 12 },
  { name: "design-system" },
  { name: "random" },
  { name: "ship-it", unread: 5 },
  { name: "incidents" }
];

export default function Channels() {
  return (
    <div className="mb-6">

      <p className="text-xs text-gray-400 mb-2">
        CHANNELS
      </p>

      {channels.map((channel) => (
        <div
          key={channel.name}
          className="flex justify-between px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
        >
          <span># {channel.name}</span>

          {channel.unread && (
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 rounded-full">
              {channel.unread}
            </span>
          )}

        </div>
      ))}

    </div>
  );
}

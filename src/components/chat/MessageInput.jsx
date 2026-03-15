export default function MessageInput() {
  return (
    <div className="border-t p-4 bg-white">
      <div className="flex items-center border rounded-lg px-4 py-2">
        <input
          type="text"
          placeholder="Message #general"
          className="flex-1 outline-none"
        />

        <button className="text-blue-500">
          ➤
        </button>
      </div>
    </div>
  );
}

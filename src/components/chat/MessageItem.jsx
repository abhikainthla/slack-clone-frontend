export default function MessageItem({ message }) {
  return (
    <div className="flex gap-3">

      <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center text-sm font-semibold">
        {message.user[0]}
      </div>

      <div>
        <p className="font-medium">
          {message.user}
        </p>

        <p className="text-gray-600">
          {message.text}
        </p>
      </div>

    </div>
  );
}

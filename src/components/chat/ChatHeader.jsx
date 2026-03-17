import useChatStore from "../../store/chatStore";

export default function ChatHeader() {
  const activeChannel = useChatStore((s) => s.activeChannel);

  return (
    <div className="border-b px-6 py-4 bg-white">

      {activeChannel ? (
        <>
          <h2 className="font-semibold">
            # {activeChannel.name}
          </h2>
          <p className="text-sm text-gray-500">
            Channel discussion
          </p>
        </>
      ) : (
        <p className="text-gray-400">
          Select a channel
        </p>
      )}

    </div>
  );
}

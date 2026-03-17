import { useState } from "react";
import useChatStore from "../../store/chatStore";
import { createChannel } from "../../services/channelService";
import { useParams } from "react-router-dom";

export default function Channels({ channels }) {
  const { id: workspaceId } = useParams();

  const setChannels = useChatStore((s) => s.setChannels);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);

  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return;

    setLoading(true);

    try {
      const res = await createChannel({
        name,
        workspaceId,
      });

      // update UI instantly
      setChannels((prev) => [...prev, res.data]);

      setName("");
      setShowInput(false);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">

      <div className="flex justify-between items-center mb-2">
        <p className="text-xs text-gray-400">CHANNELS</p>

        <button
          onClick={() => setShowInput(!showInput)}
          className="text-sm text-purple-600"
        >
          + Add
        </button>
      </div>

      {/* Create Input */}
      {showInput && (
        <div className="flex gap-2 mb-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="channel-name"
            className="flex-1 px-2 py-1 border rounded text-sm"
          />

          <button
            onClick={handleCreate}
            className="text-xs bg-purple-600 text-white px-2 rounded"
          >
            {loading ? "..." : "Create"}
          </button>
        </div>
      )}

      {/* Channel List */}
      {channels.map((channel) => (
        <div
          key={channel._id}
          onClick={() => setActiveChannel(channel)}
          className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
        >
          # {channel.name}
        </div>
      ))}

    </div>
  );
}

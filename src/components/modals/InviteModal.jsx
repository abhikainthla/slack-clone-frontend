import { useState } from "react";
import { inviteToChannel } from "../../services/channelService";
import useChatStore from "../../store/chatStore";

export default function InviteModal() {
  const [userId, setUserId] = useState("");
  const activeChannel = useChatStore((s) => s.activeChannel);
  const role = activeChannel?.role || "member";

  if (!["admin", "moderator"].includes(role)) {
  return null;
}

  const handleInvite = async () => {
    await inviteToChannel(activeChannel._id, userId);
    setUserId("");
  };

  return (
    <div className="p-4">
      <input
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="border px-3 py-2 rounded"
      />

      <button
        onClick={handleInvite}
        className="ml-2 bg-purple-600 text-white px-3 py-2 rounded"
      >
        Invite
      </button>
    </div>
  );
}

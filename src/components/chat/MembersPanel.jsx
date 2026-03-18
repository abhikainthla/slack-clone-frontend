import useChatStore from "../../store/chatStore";
import RoleBadge from "../common/RoleBadge";
import { addModerator } from "../../services/channelService";

export default function MembersPanel() {
  const activeChannel = useChatStore((s) => s.activeChannel);
  const role = activeChannel?.role || "member";
  const isAdmin = role === "admin";

  if (!activeChannel) return null;


  const handlePromote = async (userId) => {
    await addModerator(activeChannel._id, userId);
    alert("User promoted 🚀");
  };

  return (
    <div className="w-64 border-l bg-white p-4">

      <h3 className="font-semibold mb-4">Members</h3>

      <div className="space-y-3">

        {activeChannel.members?.map((member) => (
            <div
                key={member._id}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                <span>{member.name}</span>

                <RoleBadge role={member.role} />
                </div>

                {isAdmin && member.role === "member" && (
                <button
                    onClick={() => handlePromote(member._id)}
                    className="text-xs text-purple-600"
                >
                    Promote
                </button>
                )}
            </div>
            ))}


      </div>
    </div>
  );
}

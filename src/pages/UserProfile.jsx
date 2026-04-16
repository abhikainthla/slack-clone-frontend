import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, Calendar, AtSign } from "lucide-react";
import * as Avatar from "@radix-ui/react-avatar";
import api from "../api/axios";
import useChatStore from "../store/chatStore";

export default function UserProfile() {
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${id}`);
        setUser(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading || !user) return <ProfileSkeleton />;

  // Logic fix: Ensure we use the fetched user object correctly
const presence = onlineUsers[user._id];

// fallback to API data if socket not ready
const status = presence?.status || user.status;

const isOnline = status === "online";

const lastSeen = !isOnline
  ? presence?.lastSeen || user.lastSeen
  : null;

const statusText = isOnline
  ? "Online"
  : lastSeen
  ? `Last seen ${formatLastSeen(lastSeen)}`
  : "Offline";

const formatLastSeen = (date) => {
  if (!date) return "";

  const diff = Math.floor((Date.now() - new Date(date)) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return new Date(date).toLocaleDateString();
};




  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation Row */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 mb-6 transition-all group"
        >
          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          </div>
          Back to Workspace
        </button>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          {/* Cover Header */}
          <div className="h-40 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 relative" />

          <div className="px-6 md:px-10 pb-10">
            <div className="relative flex justify-between items-end -mt-14 mb-8">
              {/* Avatar Logic Fix */}
              <Avatar.Root className="w-28 h-28 rounded-3xl border-[6px] border-white shadow-lg overflow-hidden bg-white">
                <Avatar.Image
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                  className="w-full h-full object-cover"
                  alt={user.name}
                />
                <Avatar.Fallback className="bg-gray-100 text-2xl font-bold flex items-center justify-center">
                  {user.name?.charAt(0)}
                </Avatar.Fallback>
              </Avatar.Root>

              {/* Status Badge */}
                    <div
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-tight border shadow-sm transition-colors ${
                        isOnline
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                    >
                    <span
                        className={`w-2 h-2 rounded-full ${
                        isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                    />

                    {statusText}

                    </div>

            </div>

            <div className="space-y-1.5">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{user.name}</h2>
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <AtSign size={16} />
                <span>{user.username}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-700 leading-relaxed italic">
                "{user.bio || "This user prefers to keep their mystery. No bio yet!"}"
              </p>
            </div>

            {/* Info Grid */}
            <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail size={18} className="text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Email Address</span>
                  <span className="text-sm font-medium">{user.email || "Private"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ShieldCheck size={18} className="text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Account Status</span>
                  <span className="text-sm font-medium text-blue-700">Verified Member</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto mt-20 p-4 animate-pulse">
      <div className="h-40 bg-gray-200 rounded-t-3xl" />
      <div className="p-10 bg-white rounded-b-3xl border border-gray-200">
        <div className="w-28 h-28 bg-gray-300 rounded-3xl -mt-20 border-8 border-white shadow-md" />
        <div className="mt-6 h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="mt-2 h-4 w-32 bg-gray-100 rounded-lg" />
        <div className="mt-8 h-20 w-full bg-gray-50 rounded-2xl" />
      </div>
    </div>
  );
}
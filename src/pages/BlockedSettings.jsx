import { useEffect, useState } from "react";
import { ShieldAlert, UserCheck, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import * as Avatar from "@radix-ui/react-avatar";
import toast from "react-hot-toast";

export default function BlockedSettings() {
  const [blockedList, setBlockedList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = async () => {
    try {
      // Assuming your backend returns full user objects for blockedUsers
      const res = await api.get("/users/profile"); 
      // You might need a specific endpoint like /users/blocked if profile only returns IDs
      setBlockedList(res.data.blockedUsers || []);
    } catch (err) {
      toast.error("Could not load blocked list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlocked(); }, []);

  const handleUnblock = async (userId) => {
    try {
      await api.post("/users/unblock", { userId });
      setBlockedList(prev => prev.filter(u => u._id !== userId));
      toast.success("User unblocked");
    } catch (err) {
      toast.error("Unblock failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Privacy & Blocking</h1>
          <p className="text-sm text-gray-500">Manage people you've restricted</p>
        </div>
      </header>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {blockedList.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">No blocked users</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {blockedList.map((user) => (
              <div key={user._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                    <Avatar.Image src={user.avatar} className="object-cover w-full h-full" />
                    <Avatar.Fallback className="bg-gray-200 flex items-center justify-center text-xs font-bold">
                      {user.name?.charAt(0)}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(user._id)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <UserCheck size={14} />
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
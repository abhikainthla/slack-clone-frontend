import { useState, useEffect } from "react";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import { Camera, User, CreditCard, Palette, Check, ArrowLeft, ShieldAlert, UserCheck } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import * as Avatar from "@radix-ui/react-avatar";
import toast from "react-hot-toast";
import useChatStore from "../store/chatStore";

const presetAvatars = [
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Kingston",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Felix",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Jameson",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Eden",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Andrea",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Luis"
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();
  const { setBlockedUsers } = useChatStore();

  // Navigation state for tabs
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'privacy'

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [file, setFile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [loading, setLoading] = useState(false);

  // Privacy/Blocked List States
  const [blockedList, setBlockedList] = useState([]);

  useEffect(() => {
  const fetchProfile = async () => {
    const res = await api.get("/users/profile");
    useChatStore.getState().setBlockedUsers(res.data.blockedUsers);
  };

  fetchProfile();
}, []);


const fetchBlocked = async () => {
  try {
    setLoading(true);
    const res = await api.get("/users/profile");

    console.log("Blocked Users Data:", res.data.blockedUsers);
    console.log(typeof res.data.blockedUsers[0]);


    setBlockedList(res.data.blockedUsers || []);

    // ✅ ADD THIS LINE
    setBlockedUsers(res.data.blockedUsers || []);

  } catch (err) {
    toast.error("Could not load blocked list");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (activeTab === "privacy") fetchBlocked();
  }, [activeTab]);

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = user?.avatar;
      if (file) {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await api.post("/users/avatar/upload", formData);
        avatarUrl = res.data.avatar;
      }
      if (selectedAvatar) {
        await api.post("/users/avatar/select", { avatarUrl: selectedAvatar });
        avatarUrl = selectedAvatar;
      }
      const res = await api.put("/users/profile", {
        name,
        bio,
        avatar: avatarUrl,
      });
      setAuth(res.data, localStorage.getItem("token"));
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

const handleUnblock = async (userId) => {
  try {
    // Your controller expects { userId } in the body
    await api.post("/users/unblock", { userId }); 
    setBlockedList(prev => prev.filter(u => u._id !== userId));
    toast.success("User unblocked");
  } catch (err) {
    toast.error("Unblock failed");
  }
};

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-white border-r border-gray-200 p-8 hidden md:block">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Settings</h2>
        <nav className="space-y-1">
          <NavItem 
            icon={<User size={18} />} 
            label="Profile" 
            active={activeTab === "profile"} 
            onClick={() => setActiveTab("profile")}
          />
          <NavItem 
            icon={<ShieldAlert size={18} />} 
            label="Privacy & Blocking" 
            active={activeTab === "privacy"} 
            onClick={() => setActiveTab("privacy")}
          />
          <NavItem icon={<CreditCard size={18} />} label="Account" />
          <NavItem icon={<Palette size={18} />} label="Appearance" />
        </nav>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 max-w-4xl mx-auto py-12 px-6 lg:px-12">
        <div className="mb-10 flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg border bg-white hover:bg-gray-100 transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {activeTab === "profile" ? "Public Profile" : "Privacy & Blocking"}
            </h1>
            <p className="text-gray-500 mt-2">
              {activeTab === "profile" 
                ? "Update your personal information and how others see you."
                : "Manage people you've restricted from interacting with you."}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {activeTab === "profile" ? (
            /* PROFILE FORM SECTION */
            <div className="space-y-10">
              <section>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Profile Picture</h3>
                <div className="flex flex-wrap items-center gap-8">
                  <div className="relative group">
                    <img
                      src={file ? URL.createObjectURL(file) : selectedAvatar || user?.avatar || "https://via.placeholder.com/150"}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-50 shadow-md transition group-hover:opacity-90"
                      alt="Profile"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                      <Camera className="text-white" size={24} />
                      <input type="file" className="hidden" onChange={(e) => {
                        setFile(e.target.files[0]);
                        setSelectedAvatar("");
                      }} />
                    </label>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 font-medium">Or choose a preset:</p>
                    <div className="flex gap-3">
                      {presetAvatars.map((a) => (
                        <button key={a} onClick={() => { setSelectedAvatar(a); setFile(null); }}
                          className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                            selectedAvatar === a ? "border-purple-600 scale-110 shadow-lg" : "border-transparent hover:border-gray-300"
                          }`}>
                          <img src={a} alt="avatar" className="w-full h-full" />
                          {selectedAvatar === a && (
                            <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                              <Check size={16} className="text-purple-600" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea value={bio} rows={4} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a little about yourself..."
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none resize-none" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={loading}
                  className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-70 ${loading ? "cursor-not-allowed" : ""}`}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            /* BLOCKED LIST SECTION */
            <div>
              {blockedList.length === 0 ? (
                <div className="p-12 text-center">
                  <ShieldAlert className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 font-medium">No blocked users</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 -mx-8 -my-8">
                  {blockedList.map((user) => (

                    <div key={user._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                      <div className="flex items-center gap-3">
                        <Avatar.Root className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                          <Avatar.Image src={user?.avatar}  className="object-cover w-full h-full" />
                          <Avatar.Fallback className="bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
                            {user.name?.charAt(0)}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500"> @{user?.username || "unknown"}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblock(user?._id)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      >
                        <UserCheck size={14} />
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        active 
          ? "bg-purple-50 text-purple-700 font-semibold" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}
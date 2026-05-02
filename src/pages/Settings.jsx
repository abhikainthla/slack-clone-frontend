import { useState, useEffect } from "react";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import { Camera, User, CreditCard, Palette, Check, ArrowLeft, ShieldAlert, UserCheck, Loader2 } from "lucide-react"; 
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

  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [file, setFile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [blockedList, setBlockedList] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        setBlockedUsers(res.data.blockedUsers);
      } catch (err) { console.error(err); }
    };
    fetchProfile();
  }, [setBlockedUsers]);

  const fetchBlocked = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/profile");
      setBlockedList(res.data.blockedUsers || []);
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
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50/50">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-80 bg-white border-b lg:border-r border-gray-200 lg:h-screen lg:sticky lg:top-0">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6 lg:mb-10">
             <button onClick={() => navigate(-1)} className="p-2 lg:hidden rounded-lg border bg-white hover:bg-gray-100 transition">
                <ArrowLeft size={18} />
             </button>
             <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Settings</h2>
          </div>
          
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
            <NavItem 
              icon={<User size={18} />} 
              label="Profile" 
              active={activeTab === "profile"} 
              onClick={() => setActiveTab("profile")}
            />
            <NavItem 
              icon={<ShieldAlert size={18} />} 
              label="Privacy" 
              active={activeTab === "privacy"} 
              onClick={() => setActiveTab("privacy")}
            />
            <NavItem icon={<CreditCard size={18} />} label="Account" />
            <NavItem icon={<Palette size={18} />} label="Theme" />
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          
          {/* HEADER (Desktop Only) */}
          <div className="hidden lg:flex items-start gap-4 mb-10">
            <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl border bg-white hover:bg-gray-100 transition shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === "profile" ? "Public Profile" : "Privacy & Blocking"}
              </h1>
              <p className="text-gray-500 mt-1">
                {activeTab === "profile" 
                  ? "Update your personal information and how others see you."
                  : "Manage people you've restricted from interacting with you."}
              </p>
            </div>
          </div>

          {/* FORM CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-8 lg:p-10">
              
              {activeTab === "profile" ? (
                <div className="space-y-8">
                  {/* AVATAR SECTION */}
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Profile Picture</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="relative group shrink-0">
                        <img
                          src={file ? URL.createObjectURL(file) : selectedAvatar || user?.avatar || "https://api.dicebear.com/9.x/initials/svg?seed=" + user?.name}
                          className="w-28 h-28 rounded-full object-cover ring-4 ring-purple-50 shadow-lg transition"
                          alt="Profile"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                          <Camera className="text-white" size={28} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            if(e.target.files?.[0]) {
                              setFile(e.target.files[0]);
                              setSelectedAvatar("");
                            }
                          }} />
                        </label>
                      </div>
                      
                      <div className="flex-1 w-full">
                        <p className="text-xs text-gray-500 font-medium mb-3 text-center sm:text-left">Or choose a character:</p>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                          {presetAvatars.map((a) => (
                            <button key={a} onClick={() => { setSelectedAvatar(a); setFile(null); }}
                              className={`relative shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                                selectedAvatar === a ? "border-purple-600 scale-110 shadow-md" : "border-transparent hover:border-gray-300"
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

                  <div className="h-px bg-gray-100 w-full" />

                  {/* INPUTS SECTION */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Display Name</label>
                        <input 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          placeholder="Your name"
                          className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Bio</label>
                        <textarea 
                          value={bio} 
                          rows={3} 
                          onChange={(e) => setBio(e.target.value)} 
                          placeholder="Brief description about you..."
                          className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none resize-none" 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                       <button 
                        onClick={() => navigate(-1)}
                        className="order-2 sm:order-1 px-8 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="order-1 sm:order-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-10 py-3 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* BLOCKED LIST */
                <div className="min-h-[300px]">
                  {blockedList.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="text-gray-300" size={32} />
                      </div>
                      <p className="text-gray-500 font-medium">Your block list is empty</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 -mx-5 md:-mx-8 lg:-mx-10 -my-5 md:-my-8 lg:-my-10">
                      {blockedList.map((user) => (
                        <div key={user._id} className="p-5 md:px-8 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                          <div className="flex items-center gap-4">
                            <Avatar.Root className="w-12 h-12 shrink-0 rounded-full overflow-hidden border border-gray-200">
                              <Avatar.Image src={user?.avatar} className="object-cover w-full h-full" />
                              <Avatar.Fallback className="bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
                                {user.name?.charAt(0)}
                              </Avatar.Fallback>
                            </Avatar.Root>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                              <p className="text-xs text-gray-500 truncate">@{user?.username || "user"}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblock(user?._id)}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <UserCheck size={14} />
                            <span className="hidden xs:inline">Unblock</span>
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
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 
        px-4 py-2.5 lg:py-3.5 
        rounded-xl cursor-pointer whitespace-nowrap
        transition-all duration-200 text-sm
        ${active 
          ? "bg-purple-600 text-white shadow-md shadow-purple-200 font-semibold" 
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }
      `}
    >
      <span className={active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
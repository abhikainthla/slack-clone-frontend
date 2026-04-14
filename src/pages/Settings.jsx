import { useState } from "react";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import { Camera, User, CreditCard, Palette, Check, ArrowLeft } from "lucide-react"; // Optional icons
import { useNavigate } from "react-router-dom";

const presetAvatars = [
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Kingston",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Felix",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Jameson",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Eden",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Andrea",
  "https://api.dicebear.com/9.x/toon-head/svg?seed=Luis"
  ,
];

export default function Settings() {
    const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [file, setFile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [loading, setLoading] = useState(false);

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
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-white border-r border-gray-200 p-8 hidden md:block">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Settings</h2>
        <nav className="space-y-1">
          <NavItem icon={<User size={18} />} label="Profile" active />
          <NavItem icon={<CreditCard size={18} />} label="Account" />
          <NavItem icon={<Palette size={18} />} label="Appearance" />
        </nav>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 max-w-4xl mx-auto py-12 px-6 lg:px-12">
        <div className="mb-10 flex items-start gap-4">
  
        {/* BACK BUTTON */}
        <button
            onClick={() => navigate(-1)} // go back
            className="p-2 rounded-lg border bg-white hover:bg-gray-100 transition"
        >
            <ArrowLeft size={18} />
        </button>

        {/* TITLE */}
        <div>
            <h1 className="text-3xl font-bold text-gray-900">
            Public Profile
            </h1>
            <p className="text-gray-500 mt-2">
            Update your personal information and how others see you.
            </p>
        </div>

        </div>


        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10">
          
          {/* AVATAR SECTION */}
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
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                        setFile(e.target.files[0]);
                        setSelectedAvatar(""); // Reset preset if file is picked
                    }}
                  />
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-medium">Or choose a preset:</p>
                <div className="flex gap-3">
                  {presetAvatars.map((a) => (
                    <button
                      key={a}
                      onClick={() => {
                        setSelectedAvatar(a);
                        setFile(null); // Reset file if preset is picked
                      }}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        selectedAvatar === a ? "border-purple-600 scale-110 shadow-lg" : "border-transparent hover:border-gray-300"
                      }`}
                    >
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

          {/* INPUTS */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
              <textarea
                value={bio}
                rows={4}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself..."
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none resize-none"
              />
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-70 ${
                loading ? "cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper component for sidebar items
function NavItem({ icon, label, active = false }) {
  return (
    <div
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
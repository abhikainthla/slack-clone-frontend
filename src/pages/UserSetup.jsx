import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useEffect } from "react";

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



export default function UserSetup() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);


  useEffect(() => {
  if (user?.isOnboarded) {
    navigate("/workspace");
  }
}, [user]);

const handleUpload = async () => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await api.post("/users/avatar/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.avatar;
};

const handleSubmit = async () => {
  try {
    if (!username) {
      alert("Username is required");
      return;
    }

    let avatarUrl = selectedAvatar;

    if (file) {
      avatarUrl = await handleUpload();
    }

    if (!file && selectedAvatar) {
      await api.post("/users/avatar/select", {
        avatarUrl: selectedAvatar,
      });
    }

    const res = await api.post("/users/onboarding", {
      username,
      bio,
    });

    setAuth(res.data, localStorage.getItem("token"));
    navigate("/workspace");

  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};



const handleSkip = async () => {
  try {
    const generated = user.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const res = await api.post("/users/onboarding", {
      username: generated,
      bio: "",
    });

    setAuth(res.data, localStorage.getItem("token"));
    navigate("/workspace");

  } catch (err) {
    console.error(err);
  }
};


useEffect(() => {
  if (user?.name) {
    const generated = user.name
      .toLowerCase()
      .replace(/\s+/g, "_")   // spaces → underscore
      .replace(/[^a-z0-9_]/g, ""); // remove weird chars

    setUsername(generated);
  }
}, [user]);



  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl w-[500px] shadow">

        <h2 className="text-xl font-semibold mb-4">Set up your profile</h2>

        {/* Avatar Upload */}
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files[0];
            setFile(file);

            if (file) {
              setPreview(URL.createObjectURL(file));
            }
          }}
        />

        {/* Preview */}
        {preview && (
          <img
            src={preview}
            className="w-20 h-20 rounded-full mt-3 object-cover"
          />
        )}



        {/* Preset avatars */}
        <div className="flex gap-2 mt-3">
          {presetAvatars.map((a) => (
            <img
              key={a}
              src={a}
              onClick={() => setSelectedAvatar(a)}
              className={`w-12 h-12 rounded-full cursor-pointer border ${
                selectedAvatar === a ? "border-blue-500" : ""
              }`}
            />
          ))}
        </div>

        <input
          placeholder="Username"
          className="w-full mt-4 px-3 py-2 border rounded"
          onChange={(e) => setUsername(e.target.value)}
        />

        <textarea
          placeholder="Bio"
          className="w-full mt-2 px-3 py-2 border rounded"
          onChange={(e) => setBio(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          className="w-full mt-4 bg-purple-600 text-white py-2 rounded"
        >
          Continue
        </button>

        <button
            onClick={handleSkip}
            className="w-full mt-2 text-sm text-gray-500"
            >
            Skip for now
        </button>

      </div>

    </div>
  );
}

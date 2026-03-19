import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerUser(form);
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen grid grid-cols-2">
      <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] text-white flex flex-col justify-center px-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            💬
          </div>
          <h1 className="text-2xl font-bold">SynCube</h1>
        </div>

        <p className="text-gray-300 mb-8 max-w-md">
          Where teams come together. Real-time messaging, channels, threads, and more — all in one place.
        </p>

        <ul className="space-y-4 text-gray-400">
          <li># Organize conversations in channels</li>
          <li>💬 Thread replies for focused discussions</li>
          <li>👥 Collaborate with your team in real-time</li>
        </ul>
      </div>

      <div className="flex items-center justify-center bg-gray-100">
        <form
          className="bg-white p-8 rounded-2xl shadow w-[380px]"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-semibold mb-1">Create your account</h2>
          <p className="text-gray-500 mb-6">Get started with TeamChat</p>

          <input
            name="name"
            placeholder="Your name"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            onChange={handleChange}
          />
          <input
            name="email"
            placeholder="you@example.com"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            onChange={handleChange}
          />

          {/* Password input with toggle */}
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg pr-10"
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="w-full bg-purple-600 text-white py-2 rounded-lg">
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

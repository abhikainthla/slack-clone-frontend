import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);
      setAuth(res.data.user, res.data.token);
      navigate("/workspace");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen grid grid-cols-2">
      
      {/* LEFT PANEL */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] text-white flex flex-col justify-center px-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            💬
          </div>
          <h1 className="text-2xl font-bold">SynCube</h1>
        </div>

        <p className="text-gray-300 mb-8 max-w-md">
          Where teams come together. Real-time messaging,
          channels, threads, and more — all in one place.
        </p>

        <ul className="space-y-4 text-gray-400">
          <li># Organize conversations in channels</li>
          <li>💬 Thread replies for focused discussions</li>
          <li>👥 Collaborate with your team in real-time</li>
        </ul>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center bg-gray-100">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow w-[380px]"
        >
          <h2 className="text-2xl font-semibold mb-1">Welcome back</h2>
          <p className="text-gray-500 mb-6">
            Sign in to your workspace
          </p>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="••••••••"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            onChange={handleChange}
          />

          <button className="w-full bg-purple-600 text-white py-2 rounded-lg">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-sm text-center mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-600">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

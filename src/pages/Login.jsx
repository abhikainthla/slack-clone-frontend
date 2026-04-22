import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import useAuthStore from "../store/authStore";
import { loginUser } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);
      setAuth(res.data.user, res.data.token);

      if (!res.data.user.isOnboarded) {
        navigate("/usersetup");
      } else {
        navigate("/workspace");
      }
    } catch (err) {
      const msg = err?.response?.data?.message;

      if (msg?.includes("verify your email")) {
        navigate("/check-email", { state: { email: form.email } });
      } else {
        setError(msg || "Invalid email or password");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2 bg-white font-sans selection:bg-purple-100">
      
      {/* LEFT PANEL: BRANDING & FEATURES */}
      <div className="hidden md:flex relative overflow-hidden bg-[#0F172A] flex-col justify-center px-16 lg:px-24">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-[#c084fc] mb-10 inline-block p-3 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 w-fit">
            <img src="/SynCubeHalf.png" alt="SynCube logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold pr-2">SynCube</h1>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            The workspace where <br /> 
            <span className="text-purple-400">work flows.</span>
          </h1>
          
          <p className="text-gray-400 text-lg mb-10 max-w-md leading-relaxed">
            Experience real-time collaboration that feels like being in the same room. Organize, chat, and build.
          </p>

          <div className="space-y-6">
            {[
              { icon: "📂", text: "Organize conversations in channels" },
              { icon: "💬", text: "Thread replies for focused discussions" },
              { icon: "🚀", text: "Collaborate with your team in real-time" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-gray-300 group cursor-default">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 group-hover:bg-purple-600/20 group-hover:border-purple-500/50 transition-all duration-300">
                  {item.icon}
                </span>
                <span className="text-md font-medium tracking-wide">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Credit */}
        <div className="absolute bottom-10 left-16 lg:left-24 text-gray-500 text-sm">
          © 2024 SynCube Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50 md:bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo Only */}
          <div className="md:hidden flex justify-center mb-8">
            <img src="/SynCubeMain.png" alt="SynCube" className="h-8 brightness-0" />
          </div>

          <div className="text-center md:text-left mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@company.com"
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" size={18} className="text-xs font-semibold text-purple-600 hover:text-purple-700">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              className={`w-full group relative flex items-center justify-center gap-2 py-3.5 px-4 bg-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Link */}
          <p className="text-center mt-8 text-gray-500 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-600 font-bold hover:underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
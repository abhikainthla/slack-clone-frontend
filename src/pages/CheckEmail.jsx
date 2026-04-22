import { useLocation } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResend = async () => {
    try {
      setLoading(true);
      setMessage("");

      await api.post("/auth/resend-verification", { email });

      setMessage("Verification email sent again!");
    } catch (err) {
      setMessage(
        err?.response?.data?.message || "Failed to resend email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md text-center">
        
        <h2 className="text-2xl font-bold mb-4">
          Check your email 📩
        </h2>

        <p className="text-gray-600 mb-6">
          We’ve sent a verification link to <br />
          <span className="font-semibold">{email}</span>
        </p>

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-70"
        >
          {loading ? "Sending..." : "Resend Email"}
        </button>

        {message && (
          <p className="mt-4 text-sm text-gray-500">{message}</p>
        )}

        <p className="mt-6 text-sm text-gray-400">
          Didn’t receive it? Check spam folder.
        </p>
      </div>
    </div>
  );
}

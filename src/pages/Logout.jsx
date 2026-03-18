import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Logout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    logout();

    setTimeout(() => {
      navigate("/login");
    }, 1000);
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow text-center">
        <h1 className="text-xl font-semibold mb-2">
          Logging out...
        </h1>
        <p className="text-gray-500">Please wait</p>
      </div>
    </div>
  );
}

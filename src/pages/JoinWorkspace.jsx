import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ChevronRight } from "lucide-react";
import api from "../api/axios";

export default function JoinWorkspace() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("joining"); // 'joining', 'success', 'error'

  useEffect(() => {
    const join = async () => {
      try {
        // Your backend endpoint: POST /workspaces/join/:token
        const response = await api.post(`/workspaces/join/${token}`);
        const { workspaceId } = response.data;
        
        setStatus("success");
        // Brief delay so the user sees the success state
        setTimeout(() => {
          navigate(`/workspace/${workspaceId}`);
        }, 1500);
      } catch (err) {
  console.error("Join error:", err);

  const msg = err.response?.data?.message || "Join failed";
  alert(msg); // TEMP DEBUG

  setStatus("error");
}
    };

    if (token) join();
  }, [token, navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border text-center max-w-sm w-full">
        {status === "joining" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Joining Workspace...</h1>
            <p className="text-gray-500 mt-2">Setting up your access.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChevronRight size={28} />
            </div>
            <h1 className="text-xl font-semibold">Welcome aboard!</h1>
            <p className="text-gray-500 mt-2">Redirecting you to the workspace...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h1 className="text-xl font-semibold">Invalid or Expired Link</h1>
            <p className="text-gray-500 mt-2 mb-6">This invite link is no longer valid.</p>
            <button 
              onClick={() => navigate("/")}
              className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
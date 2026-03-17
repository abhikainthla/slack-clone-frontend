import { useEffect, useState } from "react";
import { getWorkspaces, createWorkspace } from "../services/workspaceService";
import { useNavigate } from "react-router-dom";
import useChatStore from "../store/chatStore";



export default function Workspace() {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setWorkspace = useChatStore((s) => s.setWorkspace);
  const fetchWorkspaces = async () => {
    try {
      const res = await getWorkspaces();
      setWorkspaces(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!name) return;

    setLoading(true);

    try {
      await createWorkspace({ name });
      setName("");
      fetchWorkspaces();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col items-center p-8">

      <h1 className="text-3xl font-bold mb-6">
        Your Workspaces 🏢
      </h1>

      {/* Create Workspace */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 w-full max-w-md">
        <input
          type="text"
          placeholder="Workspace name"
          className="w-full border px-3 py-2 rounded mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleCreate}
          className="w-full bg-purple-600 text-white py-2 rounded"
        >
          {loading ? "Creating..." : "Create Workspace"}
        </button>
      </div>

      {/* Workspace List */}
      <div className="w-full max-w-md space-y-3">
        {workspaces.map((ws) => (
          <div
            key={ws._id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
          >
            <span className="font-medium">{ws.name}</span>

            <button
              onClick={() => {
                setWorkspace(ws);
                navigate(`/workspace/${ws._id}`);
              }}
              className="text-purple-600 text-sm"
            >
              Open →
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

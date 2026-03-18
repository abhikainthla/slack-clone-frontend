import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createWorkspace } from "../../services/workspaceService";
import { X } from "lucide-react";

export default function CreateWorkspaceModal({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("bg-purple-500");
  const [loading, setLoading] = useState(false);

  const colors = [
    "bg-indigo-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-teal-500",
  ];

  

const handleCreate = async () => {
  if (!name.trim()) return;

  try {
    setLoading(true);

    const res = await createWorkspace({
      name,
      description: desc,
      color,
    });

    //  send back to parent
    onCreated?.(res.data);

    // reset
    setName("");
    setDesc("");
    setColor("bg-purple-500");

    onOpenChange(false);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>

        {/* OVERLAY */}
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

        {/* MODAL */}
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-xl focus:outline-none">

          {/* HEADER */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Create a Workspace
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500">
                Set up a new workspace for your team.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-gray-100">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* FORM */}
          <div className="space-y-4">

            {/* NAME */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Workspace Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Design Team"
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What is this workspace about?"
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* COLOR */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Workspace Color
              </label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <div
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg cursor-pointer ${c} transition ${
                      color === c
                        ? "ring-2 ring-blue-600 scale-110"
                        : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 mt-6">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </Dialog.Close>

            <button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className={`px-4 py-2 text-sm rounded-lg text-white ${
                !name.trim() || loading
                  ? "bg-gray-400"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {loading ? "Creating..." : "Create Workspace"}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

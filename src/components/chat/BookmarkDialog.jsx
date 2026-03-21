import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import api from "../../api/axios";
import useChatStore from "../../store/chatStore";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import useAuthStore from "../../store/authStore";

export default function BookmarkDialog({ onJump }) {
  const activeChannel = useChatStore((s) => s.activeChannel);
  const [open, setOpen] = useState(false);

  const messages = useChatStore((s) => s.messages);
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState("all");
  const toggleBookmarkLocal = useChatStore((s) => s.toggleBookmarkLocal);

      const bookmarks = messages.filter((m) =>
      m.bookmarkedBy?.some((id) => id.toString() === user?._id)
    );



  /* ================= REMOVE ================= */
const handleRemove = async (id) => {
  toggleBookmarkLocal(id, user._id); //  instant UI

  try {
    await api.post(`/bookmarks/${id}`);
  } catch (err) {
    console.error(err);
    toggleBookmarkLocal(id, user._id); // rollback
  }
};

  /* ================= FILTER ================= */
  const filtered = bookmarks.filter((m) => {
    if (filter === "media") {
      return (
        m.content?.includes("cloudinary.com") ||
        m.content?.match(/\.(jpeg|jpg|png|gif|webp)$/)
      );
    }

    if (filter === "links") {
      return m.content?.startsWith("http");
    }

    return true;
  });

  const isImage = (url) =>
    url?.includes("cloudinary.com") ||
    /\.(jpeg|jpg|png|gif|webp)/i.test(url);



  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      
      {/* ✅ Trigger Button */}
      <Dialog.Trigger asChild>
        <button className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200">
          🔖 Bookmarks ({bookmarks.length})
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        {/* Dialog Content */}
        <Dialog.Content className="fixed right-4 top-16 w-[380px] max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-5 z-50 animate-in slide-in-from-right">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="font-semibold text-lg">
              🔖 Saved Items
            </Dialog.Title>

            <Dialog.Close className="text-gray-400 hover:text-black text-sm">
              ✕
            </Dialog.Close>
          </div>

          {/* FILTERS */}
          <div className="flex gap-2 mb-3">
            {["all", "links", "media"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`text-xs px-2 py-1 rounded ${
                  filter === type
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* LIST */}
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">
              No saved messages
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => (
                <div
                  key={m._id}
                  onClick={() => {
                    onJump(m._id);
                    setOpen(false); 
                  }}
                  className="group p-3 rounded-xl border bg-gray-50 hover:bg-gray-100 cursor-pointer transition relative"
                >
                  {/* SENDER */}
                  <p className="text-xs text-gray-500 mb-1">
                    {m.sender?.name || "User"}
                  </p>

                  {/* CONTENT */}
                  {isImage(m.content) ? (
                    <img src={m.content} className="rounded-lg max-h-36" />
                  ) : m.content?.startsWith("http") ? (
                    <a
                      href={m.content}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-500 text-xs underline break-all"
                    >
                      {m.content}
                    </a>
                  ) : (
                    <p className="text-sm line-clamp-2">
                      {m.content}
                    </p>
                  )}

                  {/* TIME */}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>

                  {/* REMOVE */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(m._id);
                    }}
                    className="absolute top-2 right-2 text-xs opacity-0 group-hover:opacity-100 transition text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

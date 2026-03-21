import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import useChatStore from "../../store/chatStore";

export default function PinnedDialog({ onJump }) {
  const messages = useChatStore((s) => s.messages);
  const pinned = messages.filter((m) => m.pinned);

  const [open, setOpen] = useState(false);

  const isImage = (url) =>
    url?.includes("cloudinary.com") ||
    /\.(jpeg|jpg|png|gif|webp)/i.test(url);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      
      {/* ✅ Trigger */}
      <Dialog.Trigger asChild>
        <button className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200">
          📌 Pinned ({pinned.length})
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        <Dialog.Content className="fixed right-4 top-16 w-[380px] max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-5 z-50 animate-in slide-in-from-right">

          {/* ✅ REQUIRED TITLE (fix accessibility error) */}
          <Dialog.Title className="font-semibold text-lg mb-4">
            📌 Pinned Messages
          </Dialog.Title>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-black text-sm">
            ✕
          </Dialog.Close>

          {pinned.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No pinned messages
            </p>
          ) : (
            <div className="space-y-3">
              {pinned.map((m) => (
                <div
                  key={m._id}
                  onClick={() => {
                    setOpen(false);

                    setTimeout(() => {
                      onJump(m._id);
                    }, 100);
                  }}
                  className="p-3 rounded-xl border bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                >
                  <p className="text-xs text-gray-500 mb-1">
                    {m.sender?.name || "User"}
                  </p>

                  {isImage(m.content) ? (
                    <img src={m.content} className="max-h-40 rounded-lg" />
                  ) : m.content?.startsWith("http") ? (
                    <a
                      href={m.content}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-500 underline text-sm"
                    >
                      View File
                    </a>
                  ) : (
                    <p className="text-sm line-clamp-2">
                      {m.content}
                    </p>
                  )}

                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

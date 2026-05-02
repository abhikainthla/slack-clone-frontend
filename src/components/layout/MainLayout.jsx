import { useState, useRef, useEffect } from "react";
import WorkspaceBar from "./WorkspaceBar";
import Sidebar from "./Sidebar";
import ChatHeader from "../chat/ChatHeader";
import ChatWindow from "../chat/ChatWindow";
import BookmarkSidebar from "../chat/BookmarkDialog";

export default function MainLayout() {
  const [showBookmarks, setShowBookmarks] = useState(false);
   const [sidebarOpen, setSidebarOpen] = useState(false);

  //  message refs for jump
  const messageRefs = useRef({});

  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      el.classList.add("bg-yellow-100");
      setTimeout(() => {
        el.classList.remove("bg-yellow-100");
      }, 1500);
    }
  };

  useEffect(() => {
  const handleKeyDown = (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");

    if (
      (isMac && e.metaKey && e.key === "b") ||
      (!isMac && e.ctrlKey && e.key === "b")
    ) {
      e.preventDefault();
      setShowBookmarks((prev) => !prev);
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden relative">

      {/* 🔹 MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 🔹 WORKSPACE BAR (hidden on mobile) */}
      <div className="hidden lg:flex">
        <WorkspaceBar />
      </div>

      {/* 🔹 SIDEBAR */}
      <div
        className={`
          fixed lg:static z-50 
          top-0 left-0 h-full 
          bg-white border-r
          transform transition-transform duration-300 ease-in-out
          w-[85vw] sm:w-72 max-w-[320px]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >

        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* 🔹 MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <ChatHeader
          showBookmarks={showBookmarks}
          setShowBookmarks={setShowBookmarks}
          onJump={scrollToMessage}
          onMenuClick={() => setSidebarOpen(true)} // ✅ pass toggle
        />

        <ChatWindow messageRefs={messageRefs} />

      </div>

      {/* 🔹 BOOKMARK SIDEBAR */}
      {showBookmarks && (
        <div className="fixed lg:static right-0 top-0 h-full z-50 w-full sm:w-[350px] animate-in slide-in-from-right">
          <BookmarkSidebar
            onJump={scrollToMessage}
            onClose={() => setShowBookmarks(false)}
          />
        </div>
      )}
    </div>
  );
}

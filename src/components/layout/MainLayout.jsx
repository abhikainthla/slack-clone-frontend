import { useState, useRef, useEffect } from "react";
import WorkspaceBar from "./WorkspaceBar";
import Sidebar from "./Sidebar";
import ChatHeader from "../chat/ChatHeader";
import ChatWindow from "../chat/ChatWindow";
import BookmarkSidebar from "../chat/BookmarkDialog";

export default function MainLayout() {
  const [showBookmarks, setShowBookmarks] = useState(false);

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
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden">

      <WorkspaceBar />
      <Sidebar />

      <div className="flex-1 flex">

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col">
          <ChatHeader
            showBookmarks={showBookmarks}
            setShowBookmarks={setShowBookmarks}
            onJump={scrollToMessage} 
          />

          <ChatWindow messageRefs={messageRefs} />
        </div>

        {/* RIGHT SIDEBAR */}
        {showBookmarks && (
          <div className="animate-in slide-in-from-right">
            <BookmarkSidebar
              onJump={scrollToMessage}
              onClose={() => setShowBookmarks(false)}
            />
          </div>
        )}


      </div>
    </div>
  );
}

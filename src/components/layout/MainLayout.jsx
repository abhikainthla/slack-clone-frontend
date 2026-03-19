import WorkspaceBar from "./WorkspaceBar";
import Sidebar from "./Sidebar";
import ChatHeader from "../chat/ChatHeader";
import ChatWindow from "../chat/ChatWindow";

export default function MainLayout() {
  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden">

      <WorkspaceBar />

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <ChatHeader />

        <ChatWindow/>
      </div>

    </div>
  );
}

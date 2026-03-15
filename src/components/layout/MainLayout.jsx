import WorkspaceBar from "./WorkspaceBar";
import Sidebar from "./Sidebar";
import ChatHeader from "../chat/ChatHeader";
import MessageList from "../chat/MessageList";
import MessageInput from "../chat/MessageInput";

export default function MainLayout() {
  return (
    <div className="h-screen flex bg-[#f8fafc]">

      <WorkspaceBar />

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <ChatHeader />

        <MessageList />

        <MessageInput />

      </div>

    </div>
  );
}

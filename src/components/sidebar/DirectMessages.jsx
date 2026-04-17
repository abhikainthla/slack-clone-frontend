import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { Search, MessageSquare, User, Pin, Ban, PinOff, UserCheck } from "lucide-react";
import useAuthStore from "../../store/authStore";
import useChatStore from "../../store/chatStore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import api from "../../api/axios";
import { toast } from "react-hot-toast";


export default function DirectMessages() {
  const { workspace, setDM, unreadDMs, pinnedDMs, blockedUsers, addBlockedUser, removeBlockedUser } = useChatStore();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const currentUser = useAuthStore((s) => s.user);

  const dmUser = useChatStore((s) => s.dmUser);
  const navigate = useNavigate();
   const members = workspace?.members
    ?.filter((m) => m.user?._id !== currentUser?._id)
    ?.reduce((acc, curr) => {
      if (!acc.find((m) => m.user._id === curr.user._id)) acc.push(curr);
      return acc;
    }, []) || [];
  const finalUsers = search ? results : members.map(m => m.user);
  const sortedUsers = [...finalUsers].sort((a, b) => {
  const aPinned = pinnedDMs.includes(a._id);
  const bPinned = pinnedDMs.includes(b._id);

  return bPinned - aPinned;
});


// Split users into Pinned and Others for better UI hierarchy
const filteredUsers = finalUsers.filter(
  u => !blockedUsers.includes(u._id)
);

const pinnedUsers = filteredUsers.filter(u =>
  pinnedDMs.includes(u._id)
);

const otherUsers = filteredUsers.filter(u =>
  !pinnedDMs.includes(u._id)
);


  useEffect(() => {
  const delay = setTimeout(async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    try {
      const res = await api.get(`/users/search?q=${search}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  }, 300);

  return () => clearTimeout(delay);
}, [search]);



// Filter out blocked users from the main list
const visibleUsers = otherUsers.filter(
  u => !blockedUsers.includes(u._id)
);



const clearUnread = useChatStore((s) => s.clearUnread);

useEffect(() => {
  if (dmUser?._id) {
    clearUnread(dmUser._id);
  }
}, [dmUser]);


  if (!workspace) return <SkeletonLoader />;



return (
    <div className="flex flex-col h-full bg-white">
      {/* Header & Search */}
      <div className="p-4 pb-2 space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
          Direct Messages
        </h3>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {/* Pinned Section */}
        {pinnedUsers.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1 flex items-center gap-1">
              <Pin size={10} /> Pinned
            </p>
            {pinnedUsers.map((u) => (
              <MemberRow
                key={u._id}
                user={u}
                active={dmUser?._id === u._id}
                unread={unreadDMs?.[u._id]}
                onSelect={() => setDM(u)}
                onViewProfile={() => navigate(`/profile/${u._id}`)}
              />
            ))}
          </div>
        )}

        {/* All/Results Section */}
        <div className="space-y-0.5 pb-4">
          {pinnedUsers.length > 0 && !search && (
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">
              Everyone Else
            </p>
          )}
          {visibleUsers.map((u) => (
            <MemberRow
              key={u._id}
              user={u}
              active={dmUser?._id === u._id}
              unread={unreadDMs?.[u._id]}
              onSelect={() => setDM(u)}
              onViewProfile={() => navigate(`/profile/${u._id}`)}
            />
          ))}
          {finalUsers.length === 0 && search && (
            <p className="text-center text-xs text-gray-400 py-4">No teammates found</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ user, unread, onSelect, onViewProfile, active }) {
  const { 
    onlineUsers, 
    togglePinDM, 
    pinnedDMs, 
    blockedUsers, 
    addBlockedUser, 
    removeBlockedUser ,
    setBlockedUsers 
  } = useChatStore();
  const presence = onlineUsers[user._id];
const isOnline = presence?.status === "online";

  const isPinned = pinnedDMs.includes(user._id);
  const isBlocked = blockedUsers.includes(user._id);


const handleBlock = async (user) => {
  addBlockedUser(user);

  try {
    await api.post("/users/block", { userId: user._id });
    toast.success("User blocked");
  } catch (err) {
    removeBlockedUser(user._id); // rollback
    toast.error("Failed to block user");
  }
};


const handleUnblock = async (id) => {
  removeBlockedUser(id);

  try {
    await api.post("/users/unblock", { userId: id });
    toast.success("User unblocked");
  } catch (err) {
    // rollback
    addBlockedUser({ _id: id });
    toast.error("Failed to unblock user");
  }
};



  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <div
          onClick={onSelect}
          className={`flex items-center justify-between px-2 py-2 rounded-xl cursor-pointer transition-all duration-200 group relative ${
            active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0"> {/* Added flex-shrink-0 to prevent squishing */}
              <Avatar.Root className="flex h-10 w-10 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-gray-200 border border-gray-100 shadow-sm">
                <Avatar.Image
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                  alt={user.name}
                  className="h-full w-full aspect-square object-cover" // Ensures the image fills the circle without stretching
                />
                <Avatar.Fallback 
                  className="flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs"
                  delayMs={600}
                >
                  {user.name?.charAt(0)}
                </Avatar.Fallback>
              </Avatar.Root>
              
              {/* STATUS DOT */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  isOnline ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            </div>

            <div className="flex flex-col">
              <span className={`text-sm tracking-tight ${unread > 0 ? "font-bold text-gray-900" : "font-medium"}`}>
                {user.name}
              </span>
              {unread > 0 ? (
                <span className="text-[10px] text-blue-600 font-semibold">New message</span>
              ) : (
                <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity capitalize">
                  {presence?.status || "offline"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unread > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full shadow-lg shadow-blue-200">
                {unread}
              </span>
            )}
            {isPinned && <Pin size={12} className="text-gray-300 group-hover:text-blue-400" />}
          </div>
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[180px] bg-white/80 backdrop-blur-md rounded-xl p-1.5 shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <ContextItem onClick={onSelect} icon={<MessageSquare size={16} />}>Send Message</ContextItem>
          <ContextItem onClick={onViewProfile} icon={<User size={16} />}>View Profile</ContextItem>
          <ContextMenu.Separator className="h-px bg-gray-100 my-1.5" />
          <ContextItem 
            onClick={() => togglePinDM(user._id)} 
            icon={isPinned ? <PinOff size={16} /> : <Pin size={16} />}
          >
            {isPinned ? "Unpin Chat" : "Pin Chat"}
          </ContextItem>
          <ContextItem 
            onClick={() => isBlocked ? handleUnblock(user._id) : handleBlock(user)}
            className={isBlocked ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"} 
            icon={isBlocked ? <UserCheck size={16} /> : <Ban size={16} />}
          >
            {isBlocked ? "Unblock User" : `Block @${user.username}`}
          </ContextItem>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function ContextItem({ children, onClick, icon, className = "" }) {
  return (
    <ContextMenu.Item
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium outline-none cursor-pointer rounded-lg transition-colors hover:bg-blue-50 hover:text-blue-600 ${className}`}
    >
      {icon} {children}
    </ContextMenu.Item>
  );
}

function SkeletonLoader() {
  return (
    <div className="p-4 space-y-6">
      <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-3/4" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-2 bg-gray-50 rounded animate-pulse w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
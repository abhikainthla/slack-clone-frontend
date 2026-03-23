export const enrichChannel = (channel = {}, userId) => {
  const roles = channel.roles || {};
  const admins = (roles.admins || []).map((id) => id.toString());
  const moderators = (roles.moderators || []).map((id) => id.toString());
  const members = channel.members || [];

  const currentUserId = userId?.toString();

  /* ================= ROLE ================= */
  let role = "member";

  if (admins.includes(currentUserId)) {
    role = "admin";
  } else if (moderators.includes(currentUserId)) {
    role = "moderator";
  }

  /* ================= MEMBERS ================= */
  const enrichedMembers = members.map((m) => {
    const memberId = m._id?.toString();

    return {
      ...m,
      role: admins.includes(memberId)
        ? "admin"
        : moderators.includes(memberId)
        ? "moderator"
        : "member",
    };
  });

  /* ================= UNREAD ================= */
  const lastMessage = channel.lastMessage;

  const hasUnread =
    lastMessage &&
    Array.isArray(lastMessage.readBy) &&
    !lastMessage.readBy.some((r) => {
      const id = typeof r.user === "object" ? r.user?._id : r.user;
      return id?.toString() === currentUserId;
    });

  return {
    ...channel,
    roles: {
      admins,
      moderators,
    },
    members: enrichedMembers,
    role,
    hasUnread: !!hasUnread, // ensure boolean
  };
};

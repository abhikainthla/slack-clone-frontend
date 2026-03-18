export const enrichChannel = (channel = {}, userId) => {
  const roles = channel.roles || {};
  const admins = (roles.admins || []).map((id) => id.toString());
  const moderators = (roles.moderators || []).map((id) => id.toString());
  const members = channel.members || [];

  const currentUserId = userId?.toString();

  // ✅ DETERMINE ROLE CORRECTLY
  let role = "member";

  if (admins.includes(currentUserId)) {
    role = "admin";
  } else if (moderators.includes(currentUserId)) {
    role = "moderator";
  }

  // ✅ ENRICH MEMBERS
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

  return {
    ...channel,
    roles: {
      admins,
      moderators,
    },
    members: enrichedMembers,
    role,
  };
};

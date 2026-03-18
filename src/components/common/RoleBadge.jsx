export default function RoleBadge({ role }) {
  if (role === "admin") {
    return (
      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
        Admin
      </span>
    );
  }

  if (role === "moderator") {
    return (
      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
        Mod
      </span>
    );
  }

  return (
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
      Member
    </span>
  );
}

export default function ChatHeader() {
  return (
    <div className="border-b px-6 py-4 flex items-center justify-between bg-white">

      <div>
        <h2 className="font-semibold">
          # general
        </h2>

        <p className="text-sm text-gray-500">
          Company-wide announcements
        </p>
      </div>

      <div className="flex gap-4 text-gray-500">
        ⭐ 📌 👥 🔍 🔔
      </div>

    </div>
  );
}

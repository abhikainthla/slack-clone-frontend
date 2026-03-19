import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await api.get("/bookmarks");
      setBookmarks(res.data);
    };
    fetch();
  }, []);
  const handleRemove = async (id) => {
  await api.post(`/bookmarks/toggle/${id}`);
  setBookmarks((prev) => prev.filter((b) => b.message._id !== id));
};

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">⭐ Bookmarks</h2>

      {bookmarks.map((b) => (
        <div key={b._id} className="mb-3 p-3 bg-gray-100 rounded">
          <p className="text-sm">{b.message?.content}</p>
        </div>
      ))}
    </div>
  );
}

import api from "../api/axios";

/* MESSAGE */
export const sendMessage = (data) => api.post("/messages", data);
export const getMessages = (channelId) =>
  api.get(`/messages/${channelId}`);

/* MARK AS READ */
export const markAsRead = (channelId, messageId = null) =>
  api.post(`/messages/read/${channelId}`, { messageId });

/* ================= REACTIONS ================= */

/**
 * Backend already handles:
 * - add
 * - replace
 * - remove (toggle)
 */
export const addReaction = (messageId, emoji) =>
  api.post(`/messages/reaction/${messageId}`, { emoji });

/**
 * OPTIONAL: separate remove API (if you want explicit remove)
 * Otherwise you DON'T NEED THIS because addReaction already toggles
 */
export const removeReaction = (messageId, emoji) =>
  api.post(`/messages/reaction/${messageId}`, { emoji }); // same endpoint (toggle)

/* ================= PIN ================= */

export const pinMessage = (messageId) =>
  api.put(`/messages/pin/${messageId}`);

export const unpinMessage = (messageId) =>
  api.put(`/messages/unpin/${messageId}`);

/* ================= BOOKMARK ================= */

export const toggleBookmark = (messageId) =>
  api.post(`/bookmarks/${messageId}`);

export const getBookmarks = () =>
  api.get(`/bookmarks`);


/* ================= FILE ================= */

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/messages/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

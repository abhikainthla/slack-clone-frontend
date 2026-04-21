import api from "../api/axios";

/* MESSAGE */
export const getMessages = ({ channelId, userId }) => {
  return api.get("/messages", {
    params: { channelId, userId },
  });
};

export const replyToMessage = (messageId, data) =>
  api.post(`/messages/reply/${messageId}`, data);


/* MARK AS READ */
export const markAsRead = (messageId) => {
  if (!messageId || messageId.length !== 24) return; // prevent bad calls
  return api.put(`/messages/read-message/${messageId}`);
};

/* MARK CHANNEL READ */
export const markChannelRead = (channelId, messageId) => {
  return api.post(`/messages/read/${channelId}`, { messageId });
};




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

export const uploadFile = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/messages/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percent);
    },
  });
};


export const sendMessage = (data) => {
  return api.post("/messages", data);
};
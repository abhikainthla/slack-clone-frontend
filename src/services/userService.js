import api from "../api/axios";


const formData = new FormData();
formData.append("avatar", file);

await api.post("/users/avatar/upload", formData);


await api.post("/users/avatar/select", {
  avatarUrl: selectedAvatar,
});

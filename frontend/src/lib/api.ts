import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (email: string, name: string, password: string) =>
    api.post("/auth/register", { email, name, password }),
  login: (email: string, password: string) => {
    const form = new FormData();
    form.append("username", email);
    form.append("password", password);
    return api.post("/auth/login", form);
  },
  me: () => api.get("/auth/me"),
};

export const moodApi = {
  log: (score: number, note: string, tags: string[]) => api.post("/moods", { score, note, tags }),
  list: (limit = 30) => api.get(`/moods?limit=${limit}`),
  stats: () => api.get("/moods/stats"),
};

export const journalApi = {
  create: (title: string, content: string) => api.post("/journal", { title, content }),
  list: (limit = 20) => api.get(`/journal?limit=${limit}`),
  get: (id: number) => api.get(`/journal/${id}`),
  delete: (id: number) => api.delete(`/journal/${id}`),
};

export default api;

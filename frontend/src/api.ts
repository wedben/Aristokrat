import axios from "axios";

export const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || "http://192.168.1.135:8000",
});

export function setAuthToken(token?: string) {
  if (token) {
    (api.defaults.headers as any).common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete (api.defaults.headers as any).common["Authorization"];
    localStorage.removeItem("token");
  }
}

const saved = localStorage.getItem("token");
if (saved) setAuthToken(saved);

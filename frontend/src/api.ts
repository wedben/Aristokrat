import axios from "axios";

// Получаем URL API из переменных окружения или используем localhost по умолчанию
// В production (через nginx) рекомендуем использовать относительный путь "/api"
const apiUrl = (import.meta as any).env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: apiUrl,
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

// Central API base URL configuration
const envUrl = import.meta.env.VITE_API_URL;
const rawUrl = typeof envUrl === "string" ? envUrl.trim() : "";
const cleanUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;

export const API_BASE_URL = cleanUrl || (import.meta.env.DEV ? "http://localhost:5000" : "");

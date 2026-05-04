import axios from "axios";

const API = axios.create({ baseURL: "/api" });

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);

// ─── Models ───────────────────────────────────────────────────────────────────
export const getModels = (params) => API.get("/models", { params });
export const getModel = (id) => API.get(`/models/${id}`);
export const createModel = (data) => API.post("/models", data);
export const purchaseModel = (id) => API.post(`/models/${id}/purchase`);
export const checkAccess = (id) => API.get(`/models/${id}/access`);

// ─── IPFS ─────────────────────────────────────────────────────────────────────
export const uploadToIPFS = (formData) =>
  API.post("/ipfs/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });

export default API;

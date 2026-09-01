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
export const getModelVersions = (id) => API.get(`/models/${id}/versions`);
export const createModel = (data) => API.post("/models", data);
export const createModelVersion = (id, data) => API.post(`/models/${id}/versions`, data);
export const getModelReviews = (id) => API.get(`/models/${id}/reviews`);
export const createModelReview = (id, data) => API.post(`/models/${id}/reviews`, data);
export const purchaseModel = (id, txHash, walletAddress, paymentMethod, paymentAmount) =>
  API.post(`/models/${id}/purchase`, { txHash, walletAddress, paymentMethod, paymentAmount });
export const checkAccess = (id, wallet) =>
  API.get(`/models/${id}/access`, { params: { wallet } });
export const compareModels = (ids) => API.get("/models/compare", { params: { ids } });
export const rateModel = (id, rating) => API.post(`/models/${id}/rate`, { rating });
export const runModelInference = (id, data) => API.post(`/models/${id}/infer`, data);
export const downloadModelBundleUrl = (id) => `/api/models/${id}/download`;

// ─── Governance ───────────────────────────────────────────────────────────────
export const getProposals = () => API.get("/governance/proposals");
export const createProposal = (data) => API.post("/governance/proposals", data);
export const castVote = (id, data) => API.post(`/governance/proposals/${id}/vote`, data);
export const getTreasury = () => API.get("/governance/treasury");

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export const getModelLeaderboard = () => API.get("/leaderboard/models");
export const getCreatorLeaderboard = () => API.get("/leaderboard/creators");

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardData = (wallet) => API.get("/dashboard", { params: { wallet } });
export const getPlatformStats = () => API.get("/dashboard/platform-stats");

// ─── IPFS ─────────────────────────────────────────────────────────────────────
export const uploadToIPFS = (formData) =>
  API.post("/ipfs/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });

export default API;

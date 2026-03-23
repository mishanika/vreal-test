import axios from "axios";

const BYPASS_TOKEN = "vreal-demo-bypass-2026";

const client = axios.create({ baseURL: "/api" });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || BYPASS_TOKEN;
  if (config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default client;

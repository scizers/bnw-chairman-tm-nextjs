import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3777";

export const clientApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

clientApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("auth_token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers["x-user-id"] = token;
    }
  }
  return config;
});

clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      window.localStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);

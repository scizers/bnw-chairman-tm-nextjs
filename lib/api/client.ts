import axios, { type AxiosRequestConfig } from "axios";
import {
  clearAuthToken,
  getAuthToken,
  getRefreshToken,
  persistAuthSession
} from "@/lib/auth/token";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3777";

export const clientApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

const refreshApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

clientApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

let pendingRequests: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: RetryConfig;
}> = [];

const flushQueue = (error: unknown, token?: string) => {
  pendingRequests.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
      return;
    }
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    resolve(clientApi(config));
  });
  pendingRequests = [];
};

clientApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const originalRequest = error?.config as RetryConfig | undefined;
    const requestUrl = typeof originalRequest?.url === "string" ? originalRequest.url : "";

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (!originalRequest || originalRequest._retry) {
      clearAuthToken();
      window.location.replace("/login");
      return Promise.reject(error);
    }

    if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh")) {
      clearAuthToken();
      window.location.replace("/login");
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthToken();
      window.location.replace("/login");
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshApi.post("/auth/refresh", { refreshToken });
      const newToken = data?.token;
      const newRefreshToken = data?.refreshToken;
      if (!newToken || !newRefreshToken) {
        throw new Error("Refresh response missing token.");
      }
      persistAuthSession(newToken, newRefreshToken, data?.user);
      flushQueue(null, newToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return clientApi(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      clearAuthToken();
      window.location.replace("/login");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

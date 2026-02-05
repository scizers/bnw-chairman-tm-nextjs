const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30;

export const persistAuthSession = (
  token: string,
  refreshToken: string | undefined,
  user?: { id?: string; _id?: string; name?: string; role?: string }
) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (user?.name) {
    window.localStorage.setItem("auth_user_name", user.name);
  }
  if (user?.role) {
    window.localStorage.setItem("auth_user_role", user.role);
  }
  const userId = user?.id || user?._id || token;
  if (userId) {
    window.localStorage.setItem("auth_user_id", userId);
  }
  document.cookie = `auth_token=${token}; path=/; max-age=${DEFAULT_MAX_AGE}; samesite=lax`;
  if (refreshToken) {
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${DEFAULT_MAX_AGE}; samesite=lax`;
  }
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem("auth_user_name");
  window.localStorage.removeItem("auth_user_id");
  window.localStorage.removeItem("auth_user_role");
  document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
  document.cookie = "refresh_token=; path=/; max-age=0; samesite=lax";
};

export const getAuthProfile = () => {
  if (typeof window === "undefined") {
    return { id: undefined, name: undefined, role: undefined };
  }
  return {
    id: window.localStorage.getItem("auth_user_id") ?? undefined,
    name: window.localStorage.getItem("auth_user_name") ?? undefined,
    role: window.localStorage.getItem("auth_user_role") ?? undefined
  };
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
};

export const getAuthToken = () => {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
};

export const persistAuthToken = (
  token: string,
  user?: { id?: string; _id?: string; name?: string; role?: string }
) => {
  persistAuthSession(token, undefined, user);
};

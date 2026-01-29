export const persistAuthToken = (
  token: string,
  user?: { id?: string; _id?: string; name?: string }
) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("auth_token", token);
  if (user?.name) {
    window.localStorage.setItem("auth_user_name", user.name);
  }
  const userId = user?.id || user?._id || token;
  if (userId) {
    window.localStorage.setItem("auth_user_id", userId);
  }
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; samesite=lax`;
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("auth_token");
  window.localStorage.removeItem("auth_user_name");
  window.localStorage.removeItem("auth_user_id");
  document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
};

export const getAuthProfile = () => {
  if (typeof window === "undefined") {
    return { id: undefined, name: undefined };
  }
  return {
    id: window.localStorage.getItem("auth_user_id") ?? undefined,
    name: window.localStorage.getItem("auth_user_name") ?? undefined
  };
};

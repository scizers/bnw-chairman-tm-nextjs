export const persistAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("auth_token", token);
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; samesite=lax`;
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("auth_token");
  document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
};

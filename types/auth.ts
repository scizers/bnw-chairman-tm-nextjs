export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: string;
  refreshExpiresIn?: string;
  user?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

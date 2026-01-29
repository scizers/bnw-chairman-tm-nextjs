export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn?: string;
  user?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

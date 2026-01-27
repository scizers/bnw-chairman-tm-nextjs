import "server-only";
import axios from "axios";
import { cookies } from "next/headers";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3777";

export const createServerApi = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-user-id": token } : {})
    }
  });
};

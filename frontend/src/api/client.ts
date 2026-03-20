import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export function getErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || String(err);
}

export default client;

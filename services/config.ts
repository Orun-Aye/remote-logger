import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiResponse } from "@/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * Helper function to get a cookie value by name.
 * @param name The name of the cookie to retrieve.
 * @returns The value of the cookie, or an empty string if not found.
 */
function getCookie(name: string): string {
  if (typeof document === "undefined") return ""; // Return empty string if not in a browser environment
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return "";
}

/**
 * Helper function to remove a cookie by name.
 * This works by setting the cookie's expiration to a past date.
 * @param name The name of the cookie to remove.
 */
function removeCookie(name: string): void {
  if (typeof document === "undefined") return; // Exit if not in a browser environment
  document.cookie = name + '=; Max-Age=-99999999;';
}

/**
 * The raw JWT, for the rare case that needs it outside an apiClient request:
 * top-level browser navigations to the API cannot carry an Authorization
 * header, so they pass the token as a query param instead.
 */
export function getAuthToken(): string {
  return getCookie("authToken");
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Get the auth token from cookies instead of localStorage
    const token = getCookie("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // Don't redirect for auth endpoints (login/signup naturally return 401 on bad credentials)
      const isAuthEndpoint =
        url.includes("/users/login") || url.includes("/users/signup");

      if (!isAuthEndpoint) {
        removeCookie("authToken");
        if (typeof window !== "undefined") {
          // Use dynamic import to avoid bundling toast in non-browser contexts
          import("sonner").then(({ toast }) => {
            toast.error("Session expired. Please sign in again.");
          });
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

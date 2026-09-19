import { SignUpType } from "@/lib/schemas/auth";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";
import { apiClient } from "./config";
import { useApperioStore } from "@/store/apperio-store";

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
  errors?: string[];
  meta?: any;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Persists a session: the JWT cookie plus the user payload the dashboard reads.
 *
 * Both halves matter. `useBetaAccess` derives betaTier from the store's
 * currentUser and falls back to "core" when it is null, so setting the cookie
 * alone leaves every user gated out of advanced routes regardless of their
 * actual tier. Call this from every path that receives a token.
 */
export const establishSession = (data: any): void => {
  if (data?.token) {
    Cookies.set("authToken", data.token, { expires: 7 });
  }

  if (data?._id) {
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
    useApperioStore.getState().setCurrentUser({
      id: String(data._id),
      email: data.email,
      name: name || undefined,
      betaAccess: data.betaAccess,
      betaTier: data.betaTier,
    });
  }
};

export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;

    if (axiosError.response) {
      // Server responded with error status
      const { status, data } = axiosError.response;
      const message = data?.message || "An error occurred";
      const errors = data?.errors;

      throw new ApiError(message, status, errors);
    } else if (axiosError.request) {
      // Network error
      throw new ApiError("Network error. Please check your connection.", 0);
    } else {
      // Something else went wrong
      throw new ApiError("An unexpected error occurred.", 0);
    }
  }

  // Non-axios error
  throw new ApiError("An unexpected error occurred.", 0);
};

export const authService = {
  // Sign up a new user
  signUp: async (payload: SignUpType) => {
    try {
      const { confirmPassword, ...serverPayload } = payload;

      const response = await apiClient.post<ApiResponse>(
        "/users/signup",
        serverPayload
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Sign up failed.",
          response.status,
          response.data.errors
        )
      }

      establishSession(response.data.data);

      return response.data.data;
    } catch (error) {
      handleApiError(error)
    }
  },

  /** * Sign in user
  */
  signIn: async (email: string, password: string) => {
    try {
      const response = await apiClient.post<ApiResponse>('/users/login', { email, password })

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || 'Sign in failed',
          response.status,
          response.data.errors
        )
      }

      // If MFA is required, return immediately without storing JWT
      if (response.data.data?.requiresMfa) {
        return response.data.data;
      }

      establishSession(response.data.data);

      return response.data.data
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * Sign out user
   */
  signOut: async (): Promise<void> => {
    try {
      Cookies.remove('authToken');
      useApperioStore.getState().setCurrentUser(null);
    } catch (error) {
      console.error('Sign out error:', error)
    } 
  },

  /**
   * Request password reset
  */
  requestPasswordReset: async (email: string) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        '/users/forgot-password',
        { email }
      )

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "Failed to request password reset",
          response.status
        )
      }
    } catch (error) {
      handleApiError(error)
    }
  },

  /**
   * OAuth login (GitHub / Google)
   */
  oauthLogin: async (code: string, provider: "github" | "google") => {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/users/oauth/login",
        { code, provider }
      );

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || "OAuth login failed.",
          response.status,
          response.data.errors
        );
      }

      establishSession(response.data.data);

      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Reset password with token
  */
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await apiClient.post<ApiResponse>(
        '/users/reset-password',
        { token, newPassword }
      )

      if (response.data.status === "error") {
        throw new ApiError(
          response.data.message || 'Failed to reset password',
          response.status
        )
      }
    } catch (error) {
      handleApiError(error)
    }
  }
};


export const signupUser = authService.signUp
export const signinUser = authService.signIn
export const signoutUser = authService.signOut
export const oauthLogin = authService.oauthLogin
export const passwordResetRequest = authService.requestPasswordReset
export const changePassword = authService.resetPassword

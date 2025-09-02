import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { SignupData, LoginData, ForgotPasswordData, ResetPasswordData, User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  signupMutation: UseMutationResult<any, Error, SignupData>;
  forgotPasswordMutation: UseMutationResult<any, Error, ForgotPasswordData>;
  resetPasswordMutation: UseMutationResult<any, Error, ResetPasswordData>;
  regenerateRecoveryMutation: UseMutationResult<any, Error, void>;
};

export const SecureAuthContext = createContext<AuthContextType | null>(null);

export function SecureAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          return undefined;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        const data = await res.json();
        return data.user;
      } catch (error) {
        return undefined;
      }
    },
    retry: false,
  });

  const signupMutation = useMutation({
    mutationFn: async (credentials: SignupData) => {
      const res = await apiRequest("POST", "/api/auth/signup", credentials);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Account created successfully!",
        description: `Welcome to BitVault Pro! Your recovery code is: ${data.recoveryCode}`,
        variant: "default",
        duration: 10000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Login successful",
        description: "Welcome back to BitVault Pro!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Password reset instructions sent",
        description: data.message,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Password reset successful",
        description: `${data.message} New recovery code: ${data.newRecoveryCode}`,
        variant: "default",
        duration: 10000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateRecoveryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/regenerate-recovery");
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Recovery code regenerated",
        description: `New recovery code: ${data.recoveryCode}`,
        variant: "default",
        duration: 10000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to regenerate recovery code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <SecureAuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        signupMutation,
        forgotPasswordMutation,
        resetPasswordMutation,
        regenerateRecoveryMutation,
      }}
    >
      {children}
    </SecureAuthContext.Provider>
  );
}

export function useSecureAuth() {
  const context = useContext(SecureAuthContext);
  if (!context) {
    throw new Error("useSecureAuth must be used within a SecureAuthProvider");
  }
  return context;
}
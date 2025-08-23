
import { toast } from "@/hooks/use-toast";

export const showSuccessToast = (title: string, description: string) => {
  toast({
    title: `✅ ${title}`,
    description,
    variant: "default",
  });
};

export const showErrorToast = (title: string, description: string, actionText?: string) => {
  toast({
    title: `⚠️ ${title}`,
    description,
    variant: "destructive",
  });
};

export const showWarningToast = (title: string, description: string) => {
  toast({
    title: `⚡ ${title}`,
    description,
    variant: "warning" as any,
  });
};

export const showInfoToast = (title: string, description: string) => {
  toast({
    title: `ℹ️ ${title}`,
    description,
    variant: "info" as any,
  });
};

// Predefined professional messages for common scenarios
export const ProfessionalMessages = {
  auth: {
    loginSuccess: {
      title: "Welcome Back!",
      description: "You've successfully signed in to your BitVault Pro account. Your investments await!"
    },
    loginFailed: {
      title: "Login Failed",
      description: "The email or password you entered is incorrect. Please verify your credentials and try again."
    },
    sessionExpired: {
      title: "Session Expired",
      description: "For your security, you've been logged out. Please sign in again to continue."
    },
    networkError: {
      title: "Connection Issue",
      description: "Unable to connect to our servers. Please check your internet connection and try again."
    }
  },
  investment: {
    success: {
      title: "Investment Created!",
      description: "Your Bitcoin investment has been successfully activated and is now generating returns."
    },
    insufficientFunds: {
      title: "Insufficient Balance",
      description: "You don't have enough Bitcoin to make this investment. Please deposit more funds to continue."
    },
    planUnavailable: {
      title: "Plan Unavailable",
      description: "This investment plan is currently not available. Please select a different plan or try again later."
    }
  },
  transaction: {
    success: {
      title: "Transaction Successful",
      description: "Your transaction has been processed successfully and will reflect in your account shortly."
    },
    pending: {
      title: "Transaction Pending",
      description: "Your transaction is being processed. This may take a few minutes to complete."
    },
    failed: {
      title: "Transaction Failed",
      description: "We couldn't process your transaction. Please check your details and try again."
    }
  },
  validation: {
    requiredField: {
      title: "Required Information Missing",
      description: "Please fill in all required fields marked with an asterisk (*) to continue."
    },
    invalidEmail: {
      title: "Invalid Email Format",
      description: "Please enter a valid email address in the correct format (e.g., user@example.com)."
    },
    weakPassword: {
      title: "Password Too Weak",
      description: "Your password must contain at least 8 characters with uppercase, lowercase, and numeric characters."
    }
  }
};

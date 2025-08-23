
const toastMessages = {
  auth: {
    loginSuccess: "Welcome back! Login successful.",
    loginFailed: "Login failed. Please check your email and password and try again.",
    registerSuccess: "Account created successfully! Welcome to BitVault Pro.",
    registerFailed: "Registration failed. Please check your information and try again.",
    logoutSuccess: "You've been logged out successfully.",
    sessionExpired: "Your session has expired. Please log in again.",
    invalidCredentials: "Invalid email or password. Please try again.",
    emailExists: "An account with this email already exists.",
    weakPassword: "Password must be at least 8 characters long.",
    networkError: "Network error. Please check your connection and try again."
  },
  
  deposit: {
    success: "Deposit submitted successfully! Your funds will be credited once confirmed.",
    failed: "Deposit submission failed. Please try again or contact support.",
    invalidAmount: "Please enter a valid deposit amount.",
    missingTxid: "Transaction ID is required for faster processing.",
    invalidTxid: "Please enter a valid Bitcoin transaction ID."
  },
  
  withdrawal: {
    success: "Withdrawal request submitted successfully! Processing typically takes 24-48 hours.",
    failed: "Withdrawal request failed. Please try again or contact support.",
    insufficientBalance: "Insufficient balance for this withdrawal amount.",
    invalidAddress: "Please enter a valid Bitcoin address.",
    minimumAmount: "Minimum withdrawal amount is 0.001 BTC."
  },
  
  investment: {
    success: "Investment created successfully! Your returns will begin accumulating.",
    failed: "Investment creation failed. Please try again or contact support.",
    insufficientFunds: "Insufficient balance for this investment amount.",
    planNotFound: "Selected investment plan is not available.",
    minimumAmount: "Investment amount below plan minimum."
  },
  
  profile: {
    updateSuccess: "Profile updated successfully!",
    updateFailed: "Profile update failed. Please try again.",
    passwordChangeSuccess: "Password changed successfully!",
    passwordChangeFailed: "Password change failed. Please check your current password.",
    avatarUpdateSuccess: "Profile picture updated successfully!",
    avatarUpdateFailed: "Profile picture update failed. Please try again."
  },
  
  admin: {
    userDeleteSuccess: "User deleted successfully.",
    userDeleteFailed: "Failed to delete user. Please try again.",
    transactionUpdateSuccess: "Transaction updated successfully.",
    transactionUpdateFailed: "Transaction update failed. Please try again.",
    notificationSentSuccess: "Notification sent successfully!",
    notificationSentFailed: "Failed to send notification. Please try again.",
    backupSuccess: "Database backup created successfully!",
    backupFailed: "Database backup failed. Please try again."
  },
  
  general: {
    success: "Operation completed successfully!",
    error: "Something went wrong. Please try again.",
    loading: "Processing your request...",
    networkError: "Network connection error. Please check your internet connection.",
    serverError: "Server error. Please try again later or contact support.",
    validationError: "Please check your input and try again.",
    unauthorized: "Access denied. Please log in to continue.",
    forbidden: "You don't have permission to perform this action."
  }
};

export default toastMessages;

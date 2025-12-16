import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SecureAuthProvider } from "@/hooks/use-auth-secure";
import { CurrencyProvider } from "@/hooks/use-currency";
import { ThemeProvider } from "@/contexts/theme-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { RealtimeConnection } from "@/components/realtime-connection";
import { ErrorBoundary } from "@/components/error-boundary";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Management from "@/pages/admin";
import SecureAdmin from "@/pages/secure-admin";
import AdminUserManagement from "@/pages/admin-user-management";
import ManagementTransactions from "@/pages/admin-transactions";
import ManagementNotifications from "@/pages/admin-notifications";
import AdminDatabase from "@/pages/admin-database";
import Investment from "@/pages/investment";
import History from "@/pages/history";
import Transactions from "@/pages/transactions";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import Withdraw from "@/pages/withdraw";
import Deposit from "@/pages/deposit";
import AutomatedDeposit from "@/pages/automated-deposit";
import ImportWallet from "@/pages/import-wallet";
import WalletSetup from "@/pages/wallet-setup";
import NotFound from "@/pages/not-found";
import NotificationDetail from "@/pages/notification-detail";
import TransactionDetail from "@/pages/transaction-detail";
import OAuthSuccess from "@/pages/oauth-success";
import SupportAdmin from "./pages/support-admin";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import RecoverySettingsPage from "@/pages/recovery-settings-page";
import InvestmentDashboard from "@/pages/investment-dashboard";
import TermsOfService from "@/pages/terms";
import PrivacyPolicy from "@/pages/privacy";
import RiskDisclosure from "@/pages/risk-disclosure";
import Compliance from "@/pages/compliance";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/invest" component={Landing} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/risk-disclosure" component={RiskDisclosure} />
      <Route path="/compliance" component={Compliance} />
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={InvestmentDashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/oauth-success" component={OAuthSuccess} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/recovery-settings" component={RecoverySettingsPage} />
      <Route path="/admin" component={Management} />
      <Route path="/admin-transactions" component={ManagementTransactions} />
      <Route path="/admin-notifications" component={ManagementNotifications} />
      <Route path="/admin-database" component={AdminDatabase} />
      <Route path="/Hello10122" component={SecureAdmin} />
      <Route path="/Hello10122add" component={AdminUserManagement} />
      <Route path="/investment" component={Investment} />
      <Route path="/history" component={History} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/notifications/:id" component={NotificationDetail} />
      <Route path="/transactions/:id" component={TransactionDetail} />
      <Route path="/profile" component={Profile} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/deposit/automated" component={AutomatedDeposit} />
      <Route path="/import-wallet" component={ImportWallet} />
      <Route path="/wallet-setup" component={WalletSetup} />
      <Route path="/support-admin" component={SupportAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SidebarProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <CurrencyProvider>
                <AuthProvider>
                  <SecureAuthProvider>
                    <RealtimeConnection />
                    <Toaster />
                    <Router />
                  </SecureAuthProvider>
                </AuthProvider>
              </CurrencyProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </SidebarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
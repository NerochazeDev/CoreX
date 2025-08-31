import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CurrencyProvider } from "@/hooks/use-currency";
import { RealtimeConnection } from "@/components/realtime-connection";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Management from "@/pages/admin";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/oauth-success" component={OAuthSuccess} />
      <Route path="/admin" component={Management} />
      <Route path="/admin-transactions" component={ManagementTransactions} />
      <Route path="/admin-notifications" component={ManagementNotifications} />
      <Route path="/admin-database" component={AdminDatabase} />
      <Route path="/Hello10122" component={Management} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CurrencyProvider>
          <AuthProvider>
            <RealtimeConnection />
            <Toaster />
            <Router />
          </AuthProvider>
        </CurrencyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

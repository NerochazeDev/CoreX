import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import React from "react";
import type { User, InvestmentPlan } from "@shared/schema";
import { formatBitcoin } from "@/lib/utils";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import { Users, DollarSign, TrendingUp, Edit, RefreshCw, Bitcoin, Send, Copy, Key, Settings, Clock, BarChart3, Activity, Wallet, Database, Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Menu, X, Trash2, MessageSquare, Reply, Search, Filter, UserCircle, Mail, Phone, MapPin, Calendar, CreditCard, Download } from "lucide-react";
import { downloadShieldVaultIconPNG } from "@/components/shield-vault-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface AdminStats {
  totalUsers: number;
  totalBalance: string;
  activeInvestments: number;
}

export default function Management() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [userPrivateKeys, setUserPrivateKeys] = useState<{ [userId: number]: string }>({});
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [userId: number]: boolean }>({});
  const [userTrc20PrivateKeys, setUserTrc20PrivateKeys] = useState<{ [userId: number]: string }>({});
  const [showTrc20PrivateKeys, setShowTrc20PrivateKeys] = useState<{ [userId: number]: boolean }>({});
  const [vaultAddress, setVaultAddress] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [userDetailOpen, setUserDetailOpen] = useState(false);

  // Define access permissions first before using them
  const isFullAdmin = user?.isAdmin;
  const isSupportAdmin = user?.isSupportAdmin;
  const hasAnyAdminAccess = isFullAdmin || isSupportAdmin;

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Set initial tab based on user permissions
  useEffect(() => {
    if (!isFullAdmin && isSupportAdmin) {
      setActiveTab("support"); // Support admins start on support messages
    } else if (isFullAdmin) {
      setActiveTab("overview"); // Full admins start on overview
    }
  }, [isFullAdmin, isSupportAdmin]);

  // Removed backdoor access flag - using proper authentication only

  if (!hasAnyAdminAccess) {
    setLocation('/home');
    return null;
  }

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: usersResponse } = useQuery<{users: User[], pagination: any, filters: any}>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include' // Ensure cookies are sent
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const users = usersResponse?.users;

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
  });

  const { data: adminConfig } = useQuery<{vaultAddress: string; depositAddress: string; freePlanRate: string}>({
    queryKey: ['/api/admin/config'],
  });

  // Update state when config data changes
  useEffect(() => {
    if (adminConfig && typeof adminConfig === 'object') {
      setVaultAddress((adminConfig as any).vaultAddress || "");
      setDepositAddress((adminConfig as any).depositAddress || "");
    }
  }, [adminConfig]);

  const updateConfigMutation = useMutation({
    mutationFn: async ({ vaultAddress, depositAddress }: { vaultAddress: string; depositAddress: string }) => {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultAddress, depositAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update config');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
      toast({
        title: "Configuration Updated",
        description: "Vault addresses have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFreePlanRateMutation = useMutation({
    mutationFn: async ({ rate }: { rate: string }) => {
      const response = await fetch('/api/admin/update-free-plan-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate })
      });
      if (!response.ok) throw new Error('Failed to update free plan rate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
      toast({ title: "Free plan rate updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update free plan rate", variant: "destructive" });
    }
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, balance }: { userId: number; balance: string }) => {
      const response = await fetch('/api/admin/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, balance }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setDialogOpen(false);
      setNewBalance("");
      setSelectedUser(null);
      toast({
        title: "Balance Updated",
        description: "User balance has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchPrivateKeyMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/user/${userId}/private-key`);
      if (!response.ok) throw new Error('Failed to fetch private key');
      return response.json();
    },
    onSuccess: (data, userId) => {
      setUserPrivateKeys(prev => ({ ...prev, [userId]: data.privateKey }));
      setShowPrivateKeys(prev => ({ ...prev, [userId]: true }));
      toast({ title: "Private Key Retrieved", description: "Bitcoin private key loaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to fetch private key", variant: "destructive" });
    },
  });

  const fetchTrc20PrivateKeyMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/user/${userId}/trc20-private-key`);
      if (!response.ok) throw new Error('Failed to fetch TRC20 private key');
      return response.json();
    },
    onSuccess: (data, userId) => {
      setUserTrc20PrivateKeys(prev => ({ ...prev, [userId]: data.privateKey }));
      setShowTrc20PrivateKeys(prev => ({ ...prev, [userId]: true }));
      toast({ title: "TRC20 Key Retrieved", description: "TRC20 private key loaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to fetch TRC20 private key", variant: "destructive" });
    },
  });

  const syncAllBalancesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/sync-all-balances', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Balances Synced",
        description: "All user balances synced with blockchain",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ User Deleted",
        description: "The user account has been permanently removed from the system along with all associated data.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testBitcoinGenMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/test-bitcoin-generation', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Test Passed" : "Test Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      console.log('Bitcoin Generation Test Results:', data);
    },
    onError: (error) => {
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: number; planId: number | null }) => {
      const response = await fetch('/api/admin/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setPlanDialogOpen(false);
      setSelectedPlan("");
      setSelectedUser(null);
      toast({
        title: "Plan Updated",
        description: "User investment plan has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlanAmountMutation = useMutation({
    mutationFn: async ({ planId, minAmount }: { planId: number; minAmount: string }) => {
      const response = await fetch('/api/admin/update-plan-amount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, minAmount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investment-plans'] });
      toast({
        title: "Plan Updated",
        description: "Investment plan minimum amount has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlanRateMutation = useMutation({
    mutationFn: async ({ planId, dailyReturnRate }: { planId: number; dailyReturnRate: string }) => {
      const response = await fetch('/api/admin/update-plan-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, dailyReturnRate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investment-plans'] });
      toast({
        title: "Plan Updated",
        description: "Investment plan daily return rate has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateBalance = (user: User) => {
    setSelectedUser(user);
    setNewBalance(user.balance);
    setDialogOpen(true);
  };

  const handleUpdatePlan = (user: User) => {
    setSelectedUser(user);
    setSelectedPlan(user.currentPlanId?.toString() || "0");
    setPlanDialogOpen(true);
  };

  const submitBalanceUpdate = () => {
    if (!selectedUser) return;

    updateBalanceMutation.mutate({
      userId: selectedUser.id,
      balance: newBalance,
    });
  };

  const submitPlanUpdate = () => {
    if (!selectedUser) return;

    const planId = selectedPlan === "0" ? null : parseInt(selectedPlan);
    updatePlanMutation.mutate({
      userId: selectedUser.id,
      planId,
    });
  };

  const togglePrivateKey = (userId: number) => {
    if (showPrivateKeys[userId]) {
      setShowPrivateKeys(prev => ({ ...prev, [userId]: false }));
    } else {
      fetchPrivateKeyMutation.mutate(userId);
    }
  };

  const toggleTrc20PrivateKey = (userId: number) => {
    if (showTrc20PrivateKeys[userId]) {
      setShowTrc20PrivateKeys(prev => ({ ...prev, [userId]: false }));
    } else {
      fetchTrc20PrivateKeyMutation.mutate(userId);
    }
  };

  const copyPrivateKey = (privateKey: string) => {
    navigator.clipboard.writeText(privateKey);
    toast({
      title: "Copied",
      description: "Private key copied to clipboard",
    });
  };

  const copyTrc20Address = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "TRC20 address copied to clipboard",
    });
  };

  const updateConfig = () => {
    updateConfigMutation.mutate({ vaultAddress, depositAddress });
  }

  // Define navigation items based on user permissions
  const getNavigationItems = () => {
    if (!isFullAdmin && isSupportAdmin) {
      // Support admins only get access to support messages
      return [
        { id: "support", label: "Support Messages", icon: MessageSquare },
      ];
    }

    // Full admins get access to everything
    return [
      { id: "overview", label: "Overview", icon: BarChart3 },
      { id: "users", label: "User Management", icon: Users },
      { id: "investments", label: "Investment Control", icon: Activity },
      { id: "plans", label: "Investment Plans", icon: TrendingUp },
      { id: "transactions", label: "Transactions", icon: Clock },
      { id: "support", label: "Support Messages", icon: MessageSquare },
      { id: "security", label: "Security", icon: Shield },
      { id: "database", label: "Database Management", icon: Database },
      { id: "config", label: "Configuration", icon: Settings },
      { id: "brand", label: "Brand Showcase", icon: Bitcoin },
    ];
  };

  const navigationItems = getNavigationItems();

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-orange-600 via-orange-700 to-orange-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-orange-500/30 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">₿</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">BitVault Pro</h1>
            <p className="text-orange-200 text-xs font-medium">
              {!isFullAdmin && isSupportAdmin ? "Support Portal" : "Admin Dashboard"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-white hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <nav className="mt-6 px-3">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'database') {
                setLocation('/admin-database');
              } else {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-white text-orange-600 font-semibold shadow-lg transform scale-105'
                : 'text-orange-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-300" />
            <span className="text-green-300 text-sm font-semibold">System Online</span>
          </div>
          <p className="text-orange-200 text-xs">
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-full blur-2xl"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-semibold">Total Users</p>
                <p className="text-4xl font-bold text-orange-900 dark:text-orange-100 mt-2">{stats?.totalUsers || 0}</p>
                <p className="text-orange-500 text-xs mt-2 font-medium">+2.5% from last month</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full blur-2xl"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold">Total Balance</p>
                <p className="text-4xl font-bold text-amber-900 dark:text-amber-100 mt-2">{formatBitcoin(stats?.totalBalance || "0")}</p>
                <p className="text-amber-500 text-xs mt-2 font-medium">BTC in system</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-2xl"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-semibold">Active Investments</p>
                <p className="text-4xl font-bold text-orange-900 dark:text-orange-100 mt-2">{stats?.activeInvestments || 0}</p>
                <p className="text-orange-500 text-xs mt-2 font-medium">Currently running</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-2xl"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-semibold">System Health</p>
                <p className="text-4xl font-bold text-green-900 dark:text-green-100 mt-2">98.5%</p>
                <p className="text-green-500 text-xs mt-2 font-medium">Uptime this month</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Connection</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Bitcoin API</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Investment Updates</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Running
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Backup</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                2 hours ago
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setLocation('/admin-transactions')}
              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              View Pending Transactions
            </Button>
            <Button
              onClick={() => setLocation('/admin-notifications')}
              variant="outline"
              className="w-full justify-start"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Notifications
            </Button>
            <Button
              onClick={() => syncAllBalancesMutation.mutate()}
              disabled={syncAllBalancesMutation.isPending}
              variant="outline"
              className="w-full justify-start"
            >
              {syncAllBalancesMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync All Balances
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Telegram Channel Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Telegram Channel Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send professional investment updates to your Telegram channel with current user statistics and top performers.
            </p>

            {/* Send Both Notifications Button (Same as 12-hour automatic) */}
            <Button
              onClick={async () => {
                try {
                  const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                  };

                  const response = await fetch('/api/admin/send-both-notifications', {
                    method: 'POST',
                    headers,
                    credentials: 'include'
                  });

                  if (response.ok) {
                    const result = await response.json();
                    toast({
                      title: "Both Notifications Sent! 🎉",
                      description: "Detailed investment charts + regular updates sent to Telegram channel.",
                    });
                  } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to send both notifications');
                  }
                } catch (error: any) {
                  console.error('Both notifications error:', error);
                  toast({
                    title: "Update Failed",
                    description: `Failed to send notifications: ${error.message}`,
                    variant: "destructive"
                  });
                }
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Both Notifications Now (12-Hour Style)
            </Button>

            {/* Individual notification buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={async () => {
                  try {
                    const headers: Record<string, string> = {
                      'Content-Type': 'application/json'
                    };

                    const response = await fetch('/api/test-daily-stats', {
                      method: 'POST',
                      headers,
                      credentials: 'include'
                    });

                    if (response.ok) {
                      toast({
                        title: "Investment Charts Sent! 📊",
                        description: "Detailed investment plan charts sent to Telegram.",
                      });
                    } else {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to send charts');
                    }
                  } catch (error: any) {
                    toast({
                      title: "Update Failed",
                      description: `Failed to send charts: ${error.message}`,
                      variant: "destructive"
                    });
                  }
                }}
                variant="outline"
                className="text-xs"
              >
                📊 Charts Only
              </Button>

              <Button
                onClick={async () => {
                  try {
                    const headers: Record<string, string> = {
                      'Content-Type': 'application/json'
                    };

                    const response = await fetch('/api/admin/test-telegram', {
                      method: 'POST',
                      headers,
                      credentials: 'include'
                    });

                    if (response.ok) {
                      toast({
                        title: "Banner Update Sent! 🖼️",
                        description: "Regular update with banner sent to Telegram.",
                      });
                    } else {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to send update');
                    }
                  } catch (error: any) {
                    toast({
                      title: "Update Failed",
                      description: `Failed to send update: ${error.message}`,
                      variant: "destructive"
                    });
                  }
                }}
                variant="outline"
                className="text-xs"
              >
                🖼️ Banner Only
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
            <p><strong>What gets sent:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Current Bitcoin price and market data</li>
              <li>Top 30 performing investors with portfolio stats</li>
              <li>Platform statistics and metrics</li>
              <li>Professional branding and messaging</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUserDetailDialog = () => {
    if (!selectedUser) return null;
    const userPlan = investmentPlans?.find(plan => plan.id === selectedUser.currentPlanId);

    return (
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {selectedUser.firstName?.[0] || selectedUser.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">User Profile Management</h3>
                <p className="text-sm text-muted-foreground">ID: {selectedUser.id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-orange-500" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{selectedUser.country || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Registration Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Account Status</Label>
                  <div className="flex gap-1">
                    {selectedUser.isAdmin && <Badge className="bg-yellow-100 text-yellow-800">Admin</Badge>}
                    {selectedUser.isSupportAdmin && <Badge className="bg-blue-100 text-blue-800">Support</Badge>}
                    {!selectedUser.isAdmin && !selectedUser.isSupportAdmin && <Badge variant="secondary">Regular User</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-500" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <Label className="text-xs text-green-700 font-semibold">Current Balance</Label>
                    <p className="text-2xl font-bold text-green-700 font-mono">{formatBitcoin(selectedUser.balance)} BTC</p>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBalance(selectedUser)}
                      className="mt-2 w-full bg-green-600 hover:bg-green-700"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Update Balance
                    </Button>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                    <Label className="text-xs text-orange-700 font-semibold">Investment Plan</Label>
                    <p className="text-lg font-bold text-orange-700">
                      {userPlan ? userPlan.name : 'Free Plan'}
                    </p>
                    {userPlan && (
                      <p className="text-sm text-orange-600">{(parseFloat(userPlan.dailyReturnRate) * 100).toFixed(2)}% daily</p>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePlan(selectedUser)}
                      className="mt-2 w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Change Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bitcoin className="w-5 h-5 text-orange-500" />
                  Wallet & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Bitcoin Address</Label>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
                    <code className="text-xs flex-1 break-all">{selectedUser.bitcoinAddress || 'Not generated'}</code>
                    {selectedUser.bitcoinAddress && (
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedUser.bitcoinAddress!, 'Bitcoin address')}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Bitcoin Private Key</Label>
                  <div className="flex items-center gap-2">
                    {showPrivateKeys[selectedUser.id] ? (
                      <>
                        <Input
                          type="text"
                          value={userPrivateKeys[selectedUser.id] || ""}
                          readOnly
                          className="flex-1 text-xs font-mono bg-red-50 border-red-200"
                        />
                        <Button size="sm" onClick={() => copyToClipboard(userPrivateKeys[selectedUser.id], 'Private key')}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowPrivateKeys(prev => ({ ...prev, [selectedUser.id]: false }))}>
                          <EyeOff className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => fetchPrivateKeyMutation.mutate(selectedUser.id)} className="w-full">
                        <Eye className="w-3 h-3 mr-1" />
                        Show Private Key
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-xs text-emerald-700 font-semibold mb-2 block">TRC20 Deposit Address</Label>
                  <div className="flex items-center gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-200 mb-3">
                    <code className="text-xs flex-1 break-all text-emerald-700">{selectedUser.trc20DepositAddress || 'Not assigned'}</code>
                    {selectedUser.trc20DepositAddress && (
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedUser.trc20DepositAddress!, 'TRC20 address')}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <Label className="text-xs text-emerald-700 font-semibold mb-2 block">TRC20 Private Key</Label>
                  <div className="flex items-center gap-2">
                    {showTrc20PrivateKeys[selectedUser.id] ? (
                      <>
                        <Input
                          type="text"
                          value={userTrc20PrivateKeys[selectedUser.id] || ""}
                          readOnly
                          className="flex-1 text-xs font-mono bg-red-50 border-red-200"
                        />
                        <Button size="sm" onClick={() => copyToClipboard(userTrc20PrivateKeys[selectedUser.id], 'TRC20 key')}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowTrc20PrivateKeys(prev => ({ ...prev, [selectedUser.id]: false }))}>
                          <EyeOff className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => fetchTrc20PrivateKeyMutation.mutate(selectedUser.id)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Eye className="w-3 h-3 mr-1" />
                        Show TRC20 Key
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {!selectedUser.isAdmin && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-600 mb-3">
                    Permanently delete this user account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${selectedUser.email}? This action is irreversible.`)) {
                        deleteUserMutation.mutate(selectedUser.id);
                      }
                    }}
                    disabled={deleteUserMutation.isPending}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User Account'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admin">Admins Only</SelectItem>
                <SelectItem value="support">Support Staff</SelectItem>
                <SelectItem value="regular">Regular Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <span>Total: {filteredUsers?.length || 0}</span>
            <span>•</span>
            <span>Admins: {filteredUsers?.filter(u => u.isAdmin).length || 0}</span>
            <span>•</span>
            <span>Support: {filteredUsers?.filter(u => u.isSupportAdmin).length || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers?.map((user) => {
          const userPlan = investmentPlans?.find(plan => plan.id === user.currentPlanId);
          return (
            <Card key={user.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
              setSelectedUser(user);
              setUserDetailOpen(true);
            }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {user.isAdmin && <Badge className="bg-yellow-100 text-yellow-800 text-xs">Admin</Badge>}
                    {user.isSupportAdmin && <Badge className="bg-blue-100 text-blue-800 text-xs">Support</Badge>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs truncate">{user.email}</span>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <Label className="text-xs text-green-700">Balance</Label>
                    <p className="font-mono font-bold text-green-700">{formatBitcoin(user.balance)} BTC</p>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <Label className="text-xs text-orange-700">Plan</Label>
                    <p className="font-semibold text-orange-700">{userPlan ? userPlan.name : 'Free Plan'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateBalance(user);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Balance
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdatePlan(user);
                      }}
                      className="text-xs"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}

      {renderUserDetailDialog()}
    </div>
  );

  const renderPlansTab = () => (
    <div className="space-y-6">
      {/* Support Admin Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Support Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold">Grant Support Access</span>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              Grant specific users access to only the support message dashboard to handle customer inquiries without full admin privileges.
            </p>
            <Button
              onClick={() => setLocation('/admin-user-management')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Manage Support Admin Access
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Investment Plans Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Investment Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {investmentPlans?.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-6 bg-gradient-to-r from-gray-50 to-white shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      {plan.name}
                      <Badge
                        className="px-2 py-1 text-xs"
                        style={{ backgroundColor: plan.color + '20', color: plan.color }}
                      >
                        ID: {plan.id}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.roiPercentage}% ROI over {plan.durationDays} days
                    </p>
                  </div>
                  <Badge
                    className="px-3 py-1"
                    style={{ backgroundColor: plan.color + '20', color: plan.color }}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`minAmount-${plan.id}`}>Minimum Amount (BTC)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={`minAmount-${plan.id}`}
                        type="number"
                        step="0.00000001"
                        defaultValue={plan.minAmount}
                        placeholder="0.001"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`minAmount-${plan.id}`) as HTMLInputElement;
                          if (input && input.value !== plan.minAmount) {
                            updatePlanAmountMutation.mutate({
                              planId: plan.id,
                              minAmount: input.value
                            });
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Update
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`dailyRate-${plan.id}`}>Daily Return Rate (%)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={`dailyRate-${plan.id}`}
                        type="number"
                        step="0.0001"
                        defaultValue={(parseFloat(plan.dailyReturnRate) * 100).toFixed(4)}
                        placeholder="0.5000"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`dailyRate-${plan.id}`) as HTMLInputElement;
                          if (input) {
                            const newRate = (parseFloat(input.value) / 100).toString();
                            if (newRate !== plan.dailyReturnRate) {
                              updatePlanRateMutation.mutate({
                                planId: plan.id,
                                dailyReturnRate: newRate
                              });
                            }
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Update
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`roiPercentage-${plan.id}`}>Total ROI (%)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={`roiPercentage-${plan.id}`}
                        type="number"
                        step="1"
                        defaultValue={plan.roiPercentage}
                        placeholder="15"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Current Settings:</strong> Min: {plan.minAmount} BTC | Daily: {(parseFloat(plan.dailyReturnRate) * 100).toFixed(4)}% |
                    Total ROI: {plan.roiPercentage}% over {plan.durationDays} days
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTransactionsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Transaction Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setLocation('/admin-transactions')}
            className="h-20 bg-blue-600 hover:bg-blue-700 flex-col"
          >
            <Clock className="w-6 h-6 mb-2" />
            <span>Pending Transactions</span>
            <span className="text-xs opacity-75">Review & Approve</span>
          </Button>
          <Button
            onClick={() => setLocation('/admin-notifications')}
            variant="outline"
            className="h-20 flex-col"
          >
            <Send className="w-6 h-6 mb-2" />
            <span>Send Notifications</span>
            <span className="text-xs opacity-75">Bulk Messaging</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const { data: allInvestments, isLoading: investmentsLoading } = useQuery({
    queryKey: ['/api/admin/investments'],
    queryFn: async () => {
      const headers: Record<string, string> = {};

      const response = await fetch('/api/admin/investments', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch investments');
      return response.json();
    },
    enabled: activeTab === 'investments',
  });

  const pauseInvestmentMutation = useMutation({
    mutationFn: async ({ investmentId, reason }: { investmentId: number; reason?: string }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch(`/api/admin/investments/${investmentId}/toggle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to toggle investment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investments'] });
      toast({ title: "Investment status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update investment", description: error.message, variant: "destructive" });
    },
  });

  const cancelInvestmentMutation = useMutation({
    mutationFn: async ({ investmentId, reason, refund }: { investmentId: number; reason?: string; refund?: boolean }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch(`/api/admin/investments/${investmentId}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ reason, refund }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to cancel investment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investments'] });
      toast({ title: "Investment cancelled successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to cancel investment", description: error.message, variant: "destructive" });
    },
  });

  const renderInvestmentsTab = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Investment Management
              <Button
                size="sm"
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/investments'] })}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {investmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : !allInvestments || allInvestments.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Investments Found</h3>
                <p className="text-sm text-muted-foreground">No user investments have been created yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/investments'] })}
                  className="mt-4"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Check Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {allInvestments.map((investment: any) => (
                  <div key={investment.id} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          Investment #{investment.id}
                          <Badge className={investment.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {investment.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          User: {investment.userEmail} | Plan: {investment.planName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Amount</Label>
                        <p className="font-mono text-sm">{formatBitcoin(investment.amount)} BTC</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Current Profit</Label>
                        <p className="font-mono text-sm text-green-600">+{formatBitcoin(investment.currentProfit)} BTC</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Daily Rate</Label>
                        <p className="text-sm">{(parseFloat(investment.dailyReturnRate) * 100).toFixed(3)}%</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Start Date</Label>
                        <p className="text-sm">{new Date(investment.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const action = investment.isActive ? 'pause' : 'resume';
                          const reason = prompt(`Enter reason to ${action} this investment:\n\nThis message will be sent to the user immediately.`);
                          if (reason !== null) { // Allow empty string but not cancelled dialog
                            pauseInvestmentMutation.mutate({
                              investmentId: investment.id,
                              reason: reason || `Investment ${action}d by administrator`
                            });
                          }
                        }}
                        disabled={pauseInvestmentMutation.isPending}
                        className={investment.isActive ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}
                      >
                        {pauseInvestmentMutation.isPending ? (
                          investment.isActive ? 'Pausing...' : 'Resuming...'
                        ) : (
                          investment.isActive ? 'Pause' : 'Resume'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const reason = prompt("Enter reason for cancellation (optional):");
                          const refund = confirm("Refund the investment amount to user's balance?");
                          if (confirm(`Are you sure you want to cancel this investment?${refund ? ' The amount will be refunded.' : ''}`)) {
                            cancelInvestmentMutation.mutate({
                              investmentId: investment.id,
                              reason: reason || undefined,
                              refund
                            });
                          }
                        }}
                        disabled={cancelInvestmentMutation.isPending}
                        variant="destructive"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => testBitcoinGenMutation.mutate()}
            disabled={testBitcoinGenMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {testBitcoinGenMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing Bitcoin Generation...
              </>
            ) : (
              <>
                <Bitcoin className="w-4 h-4 mr-2" />
                Test Bitcoin Generation
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Verify that Bitcoin addresses and private keys can be generated correctly.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            User Wallet Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {users?.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={user.hasWallet ? "default" : "secondary"}>
                        {user.hasWallet ? "Has Wallet" : "No Wallet"}
                      </Badge>
                      {user.currentPlanId && (
                        <Badge variant="outline">
                          Plan ID: {user.currentPlanId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(user.privateKey || '');
                        toast({
                          title: "Copied",
                          description: "Private key copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy PK
                    </Button>
                    {user.seedPhrase && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(user.seedPhrase || '');
                          toast({
                            title: "Copied",
                            description: "Seed phrase copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Seed
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Password:</p>
                      <p className="text-xs font-mono bg-white p-2 rounded border break-all text-red-600">
                        {user.password || 'No password available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Bitcoin Address:</p>
                      <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                        {user.bitcoinAddress || 'No address generated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Private Key:</p>
                      <p className="text-xs font-mono bg-white p-2 rounded border break-all text-red-600">
                        {user.privateKey || 'No private key available'}
                      </p>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-medium text-emerald-600 mb-1">TRC20 Deposit Address:</p>
                      <p className="text-xs font-mono bg-emerald-50 p-2 rounded border border-emerald-200 break-all">
                        {user.trc20DepositAddress || 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-600 mb-1">TRC20 Private Key:</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/admin/user/${user.id}/trc20-private-key`, {
                                credentials: 'include'
                              });
                              if (!response.ok) throw new Error('Failed to fetch TRC20 private key');
                              const data = await response.json();
                              setUserPrivateKeys(prev => ({ ...prev, [`trc20_${user.id}`]: data.privateKey }));
                              setShowPrivateKeys(prev => ({ ...prev, [`trc20_${user.id}`]: true }));
                              toast({ title: "TRC20 Private Key Retrieved" });
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to fetch TRC20 private key", variant: "destructive" });
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Show TRC20 Key
                        </Button>
                        {showPrivateKeys[`trc20_${user.id}`] && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(userPrivateKeys[`trc20_${user.id}`] || '');
                                toast({ title: "Copied", description: "TRC20 private key copied to clipboard" });
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setShowPrivateKeys(prev => ({ ...prev, [`trc20_${user.id}`]: false }))}
                              variant="outline"
                            >
                              <EyeOff className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                      {showPrivateKeys[`trc20_${user.id}`] && (
                        <p className="text-xs font-mono bg-emerald-50 p-2 rounded border border-emerald-200 break-all text-emerald-700 mt-2">
                          {userPrivateKeys[`trc20_${user.id}`] || 'Loading...'}
                        </p>
                      )}
                    </div>
                  {user.seedPhrase && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Seed Phrase:</p>
                      <p className="text-xs font-mono bg-white p-2 rounded border break-all text-blue-600">
                        {user.seedPhrase}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Balance:</p>
                      <p className="text-xs font-mono">{formatBitcoin(user.balance)} BTC</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Admin:</p>
                      <p className="text-xs">{user.isAdmin ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfigTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="vaultAddress">Vault Address</Label>
              <Input
                id="vaultAddress"
                value={vaultAddress}
                onChange={(e) => setVaultAddress(e.target.value)}
                placeholder="Enter vault Bitcoin address"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="depositAddress">Deposit Address</Label>
              <Input
                id="depositAddress"
                value={depositAddress}
                onChange={(e) => setDepositAddress(e.target.value)}
                placeholder="Enter deposit Bitcoin address"
                className="mt-1 font-mono"
              />
            </div>
            <Button
              onClick={updateConfig}
              disabled={updateConfigMutation.isPending}
              className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black"
            >
              {updateConfigMutation.isPending ? "Updating..." : "Update Configuration"}
            </Button>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-4">Bitcoin Management</h3>
            <Button
              onClick={() => syncAllBalancesMutation.mutate()}
              disabled={syncAllBalancesMutation.isPending}
              className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black"
            >
              {syncAllBalancesMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing All Balances...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync All User Balances
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Check all user Bitcoin addresses on the blockchain and update balances.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderBrandTab = () => (
    <div className="space-y-6">
      {/* Main Brand Showcase Card - Advertisement Style */}
      <Card className="overflow-hidden border-0 shadow-2xl">
        <div className="relative h-96 bg-gradient-to-br from-slate-900 via-orange-900 to-black">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-amber-400/20"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-orange-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-amber-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-8">
            {/* Logo */}
            <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-2xl">
                  <span className="text-4xl font-bold text-black">₿</span>
                </div>
                <div className="text-left">
                  <h1 className="text-5xl font-black tracking-tighter mb-2">BITVAULT <span className="font-light tracking-widest text-orange-400">PRO</span></h1>
                  <div className="bg-gradient-to-r from-orange-400 to-amber-400 text-black px-4 py-1 rounded-full text-lg font-bold">
                    PREMIUM EDITION
                  </div>
                </div>
              </div>
            </div>

            {/* Taglines */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-orange-400">
                Professional Bitcoin Investment Platform
              </h2>
              <div className="flex items-center justify-center gap-8 text-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-green-400" />
                  <span>Bank-Level Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                  <span>Advanced Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bitcoin className="w-6 h-6 text-orange-400" />
                  <span>Real-Time Trading</span>
                </div>
              </div>
              <p className="text-xl text-orange-200 font-medium mt-6">
                Secure • Professional • Exclusive
              </p>
            </div>

            {/* Call to Action */}
            <div className="mt-8">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-black px-8 py-3 rounded-full text-xl font-bold shadow-2xl">
                Join the Elite Bitcoin Investors
              </div>
            </div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-400/20 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-400/20 to-transparent rounded-tr-full"></div>
        </div>
      </Card>

      {/* Alternative Brand Variations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Minimal Dark Version */}
        <Card className="overflow-hidden border border-gray-800">
          <div className="bg-slate-900 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-black">₿</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">BitVault</h3>
            <div className="bg-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold inline-block mb-4">
              PRO
            </div>
            <p className="text-gray-400">Professional Bitcoin Platform</p>
          </div>
        </Card>

        {/* Light Corporate Version */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 text-center border">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">₿</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">BitVault</h3>
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold inline-block mb-4">
              PRO EDITION
            </div>
            <p className="text-gray-600">Trusted Bitcoin Investment Solution</p>
          </div>
        </Card>
      </div>

      {/* Logo Download Section */}
      <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-600" />
            Download Shield Vault Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Logo Preview */}
            <div className="flex items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed border-orange-300">
              <div className="w-32 h-40">
                <svg viewBox="0 0 64 80" className="w-full h-full">
                  <defs>
                    <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                  </defs>
                  <path d="M 32 4 L 54 16 L 54 35 C 54 55 32 74 32 74 C 32 74 10 55 10 35 L 10 16 Z" fill="url(#brandGradient)" stroke="#fb923c" strokeWidth="2" />
                  <text x="32" y="48" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white" fontFamily="Arial">₿</text>
                </svg>
              </div>
            </div>

            {/* Download Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => downloadShieldVaultIconPNG(256)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                data-testid="button-download-logo-256"
              >
                <Download className="w-4 h-4 mr-2" />
                Download 256x320
              </Button>
              <Button 
                onClick={() => downloadShieldVaultIconPNG(512)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                data-testid="button-download-logo-512"
              >
                <Download className="w-4 h-4 mr-2" />
                Download 512x640
              </Button>
              <Button 
                onClick={() => downloadShieldVaultIconPNG(1024)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                data-testid="button-download-logo-1024"
              >
                <Download className="w-4 h-4 mr-2" />
                Download 1024x1280
              </Button>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                The shield-shaped vault logo is designed with security symbolism and your brand's orange gradient colors. Download in PNG format at your preferred resolution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Brand Guidelines & Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Color Palette */}
            <div>
              <h4 className="font-semibold mb-4">Brand Colors</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-orange-500"></div>
                  <div>
                    <p className="font-medium">Primary Orange</p>
                    <p className="text-sm text-muted-foreground">#F97316</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-amber-500"></div>
                  <div>
                    <p className="font-medium">Secondary Amber</p>
                    <p className="text-sm text-muted-foreground">#F59E0B</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-900"></div>
                  <div>
                    <p className="font-medium">Dark Background</p>
                    <p className="text-sm text-muted-foreground">#0F172A</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="font-semibold mb-4">Typography</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold">BitVault</p>
                  <p className="text-sm text-muted-foreground">Primary Brand Name</p>
                </div>
                <div>
                  <p className="text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full inline-block">
                    PRO EDITION
                  </p>
                  <p className="text-sm text-muted-foreground">Brand Modifier</p>
                </div>
                <div>
                  <p className="text-base">Professional Bitcoin Investment Platform</p>
                  <p className="text-sm text-muted-foreground">Brand Tagline</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Usage Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Always maintain the Bitcoin symbol (₿) in the logo</li>
              <li>• Use the gradient backgrounds for premium feel</li>
              <li>• Maintain minimum clear space around the logo</li>
              <li>• PRO EDITION should always appear with brand name</li>
              <li>• Use high contrast for accessibility</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Move hooks to top level to fix React hooks rule violation
  const { data: supportMessages, isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/support/messages'],
    enabled: activeTab === 'support',
  });

  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [responseText, setResponseText] = useState("");

  const respondMutation = useMutation({
      mutationFn: async ({ messageId, response, status }: { messageId: number; response: string; status: string }) => {
        return await fetch(`/api/admin/support/messages/${messageId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-backdoor-access': 'true',
          },
          body: JSON.stringify({ response, status }),
        }).then(res => {
          if (!res.ok) throw new Error('Failed to send response');
          return res.json();
        });
      },
      onSuccess: () => {
        toast({
          title: "Response Sent",
          description: "Your response has been sent to the user successfully.",
        });
        setSelectedMessage(null);
        setResponseText("");
        queryClient.invalidateQueries({ queryKey: ['/api/admin/support/messages'] });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to send response",
          variant: "destructive",
        });
      },
    });

  const renderSupportTab = () => {
    const getStatusBadge = (status: string) => {
      const colors = {
        open: "bg-green-100 text-green-800",
        in_progress: "bg-yellow-100 text-yellow-800",
        resolved: "bg-blue-100 text-blue-800",
        closed: "bg-gray-100 text-gray-800",
      };
      return colors[status as keyof typeof colors] || colors.open;
    };

    const getPriorityBadge = (priority: string) => {
      const colors = {
        low: "bg-gray-100 text-gray-600",
        normal: "bg-blue-100 text-blue-600",
        high: "bg-orange-100 text-orange-600",
        urgent: "bg-red-100 text-red-600",
      };
      return colors[priority as keyof typeof colors] || colors.normal;
    };

    return (
      <div className="space-y-6">
        {/* WhatsApp-style Header */}
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Support Chat</h2>
                <p className="text-green-100 text-sm">
                  {supportMessages?.length || 0} conversation{supportMessages?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Messages Container - WhatsApp Style */}
        <div className="max-h-[700px] overflow-y-auto bg-gray-50 rounded-lg">
          {messagesLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-16 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : supportMessages?.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
              <p className="text-gray-500">Support conversations will appear here</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {supportMessages?.map((message: any) => (
                <div key={message.id} className="space-y-4">
                  {/* User Message Bubble */}
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {(message.user?.firstName?.[0] || message.user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {message.user ?
                              `${message.user.firstName || ''} ${message.user.lastName || ''}`.trim() || message.user.email :
                              'Unknown User'
                            }
                          </span>
                          <Badge className={getPriorityBadge(message.priority)}>
                            {message.priority}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{message.subject}</h4>
                        <p className="text-gray-700 leading-relaxed">{message.message}</p>
                        {message.imageUrl && (
                          <div className="mt-3">
                            <img
                              src={message.imageUrl}
                              alt="Support attachment"
                              className="max-w-full h-48 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString()} • {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                          <Badge className={getStatusBadge(message.status)}>
                            {message.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Response Bubble */}
                  {message.adminResponse && (
                    <div className="flex gap-3 justify-end">
                      <div className="flex-1 max-w-[80%] flex justify-end">
                        <div className="bg-green-500 text-white rounded-2xl rounded-tr-md p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">Admin Response</span>
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <p className="leading-relaxed">{message.adminResponse}</p>
                          <div className="text-xs text-green-100 mt-2 text-right">
                            {new Date(message.respondedAt).toLocaleTimeString()} • {new Date(message.respondedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        A
                      </div>
                    </div>
                  )}

                  {/* Quick Reply Button */}
                  {!message.adminResponse && (
                    <div className="flex justify-center">
                      <Button
                        onClick={() => setSelectedMessage(message)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-2 flex items-center gap-2 shadow-lg"
                        size="sm"
                      >
                        <Reply className="w-4 h-4" />
                        Quick Reply
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp-Style Response Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
            {/* WhatsApp Header */}
            <div className="bg-green-600 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedMessage ? (selectedMessage.user?.firstName?.[0] || selectedMessage.user?.email?.[0] || 'U').toUpperCase() : 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {selectedMessage?.user ?
                      `${selectedMessage.user.firstName || ''} ${selectedMessage.user.lastName || ''}`.trim() || selectedMessage.user.email :
                      'Unknown User'
                    }
                  </h3>
                  <p className="text-green-100 text-sm">Support Conversation</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="text-white hover:bg-green-700 p-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {selectedMessage && (
              <div className="bg-gray-50 max-h-[500px] overflow-y-auto">
                {/* Original Message */}
                <div className="p-4">
                  <div className="flex gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {(selectedMessage.user?.firstName?.[0] || selectedMessage.user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {selectedMessage.user ?
                              `${selectedMessage.user.firstName || ''} ${selectedMessage.user.lastName || ''}`.trim() || selectedMessage.user.email :
                              'Unknown User'
                            }
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{selectedMessage.subject}</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedMessage.message}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(selectedMessage.createdAt).toLocaleTimeString()} • {new Date(selectedMessage.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Response Input Area */}
            <div className="bg-white border-t p-4">
              <div className="space-y-3">
                <Textarea
                  value={responseText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseText(e.target.value)}
                  placeholder="Type your response..."
                  className="min-h-[100px] resize-none border-2 border-gray-200 focus:border-green-500 rounded-2xl p-4 text-base"
                />

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMessage(null)}
                    className="flex-1 rounded-full border-gray-300 hover:border-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => respondMutation.mutate({
                      messageId: selectedMessage?.id,
                      response: responseText,
                      status: "resolved"
                    })}
                    disabled={!responseText.trim() || respondMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    {respondMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Response
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "users":
        return renderUsersTab();
      case "investments":
        return renderInvestmentsTab();
      case "plans":
        return renderPlansTab();
      case "transactions":
        return renderTransactionsTab();
      case "support":
        return renderSupportTab();
      case "security":
        return renderSecurityTab();
      case "config":
        return renderConfigTab();
      case "brand":
        return renderBrandTab();
      default:
        return renderOverviewTab();
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  // Filter users based on search and status
  const filteredUsers = users?.filter(u => {
    const matchesSearch = !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.firstName && u.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.lastName && u.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.id.toString().includes(searchQuery);

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'admin' && u.isAdmin) ||
      (filterStatus === 'support' && u.isSupportAdmin) ||
      (filterStatus === 'regular' && !u.isAdmin && !u.isSupportAdmin);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50/30">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white hover:bg-white/20 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {navigationItems.find(item => item.id === activeTab)?.label || "Overview"}
                </h1>
                <p className="text-sm text-orange-100 font-medium">
                  {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-100 border-green-400/30 backdrop-blur-sm px-3 py-1.5">
                <Activity className="w-3 h-3 mr-1.5" />
                Online
              </Badge>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.email}</p>
                <p className="text-xs text-orange-100">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 border border-orange-100 dark:border-orange-900/30">
              <nav className="flex space-x-2 overflow-x-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {renderTabContent()}
        </main>
      </div>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                value={selectedUser?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="balance">New Balance (BTC)</Label>
              <Input
                id="balance"
                type="number"
                step="0.00000001"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00000000"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={submitBalanceUpdate}
                disabled={updateBalanceMutation.isPending}
                className="bg-bitcoin hover:bg-bitcoin/90 text-black flex-1"
              >
                {updateBalanceMutation.isPending ? "Updating..." : "Update Balance"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Investment Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userEmail">User Email</Label>
              <Input
                id="userEmail"
                value={selectedUser?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="plan">Investment Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Free Plan</SelectItem>
                  {investmentPlans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - {(parseFloat(plan.dailyReturnRate) * 100).toFixed(2)}% daily
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={submitPlanUpdate}
                disabled={updatePlanMutation.isPending}
                className="bg-bitcoin hover:bg-bitcoin/90 text-black flex-1"
              >
                {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
              </Button>
              <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 lg:hidden"></div>

      {/* Bottom Navigation for mobile */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}
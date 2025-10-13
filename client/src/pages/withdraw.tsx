import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Send, Lock, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import type { Investment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Withdraw() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  const queryClient = useQueryClient();

  // Check for active investments
  const { data: activeInvestments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    queryFn: () => fetch(`/api/investments/user/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
    select: (data) => data?.filter((inv: Investment) => inv.isActive === true) || [],
  });

  const hasActiveInvestments = activeInvestments && activeInvestments.length > 0;

  const withdrawMutation = useMutation({
    mutationFn: async (data: { address: string; amount: string }) => {
      const res = await apiRequest("POST", "/api/withdraw", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Initiated",
        description: "Your USDT withdrawal has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed", 
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleWithdraw = () => {
    if (!address || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter both TRC20 address and amount",
        variant: "destructive",
      });
      return;
    }

    // Basic TRC20 address validation
    if (!address.startsWith('T') || address.length !== 34) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid TRC20 (TRON) address",
        variant: "destructive",
      });
      return;
    }

    // Check for active investments first
    if (hasActiveInvestments) {
      toast({
        title: "Withdrawal Blocked",
        description: "You cannot withdraw while you have active investments. Please wait for your investments to complete.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const userBalance = parseFloat(user?.balance || "0");

    if (amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (amountNum < 10) {
      toast({
        title: "Amount Too Low",
        description: "Minimum withdrawal amount is $10 USDT",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({ address, amount });
  };

  if (!user) {
    return <div>Please log in to access withdrawals</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/')}
                className="h-10 w-10 p-0 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200 border border-orange-200/50 dark:border-orange-700/50 shadow-md transition-all duration-200"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent flex items-center gap-2">
                  <Send className="w-5 h-5 text-orange-600" />
                  Withdraw USDT (TRC20)
                </h1>
                <p className="text-sm text-orange-600/80 dark:text-orange-400/80 font-medium">
                  Send USDT to TRC20 address
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* Active Investments Warning */}
        {hasActiveInvestments && (
          <Card className="mb-6 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">Withdrawals Temporarily Locked</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You have {activeInvestments?.length} active investment{activeInvestments?.length !== 1 ? 's' : ''} running. 
                    Withdrawals will be available once your investments complete.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance Info */}
        <Card className="dark-card dark-border mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">${parseFloat(user.balance || "0").toFixed(2)} USDT</p>
            {hasActiveInvestments && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Locked due to active investments
              </p>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle>Withdrawal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">TRC20 Address (TRON Network)</Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter TRC20 address (starts with T)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: TJdZLhUL7p5vEaQRSU7STTXczGJuNwbvhr
              </p>
            </div>

            <div>
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || !address || !amount || hasActiveInvestments}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawMutation.isPending ? (
                  "Processing..."
                ) : hasActiveInvestments ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Withdrawal Locked
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Withdraw USDT (TRC20)
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Network: TRON (TRC20)</p>
              <p>• Minimum withdrawal: $10 USDT</p>
              <p>• Processing time: 2-24 hours</p>
              <p>• Network fee: Deducted from withdrawal amount</p>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
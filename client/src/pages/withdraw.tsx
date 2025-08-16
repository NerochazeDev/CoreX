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
import { formatBitcoin } from "@/lib/utils";
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
        description: "Your Bitcoin withdrawal has been processed successfully.",
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
        description: "Please enter both address and amount",
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

    if (amountNum > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough Bitcoin for this withdrawal",
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
    <div className="max-w-sm mx-auto lg:max-w-4xl bg-background min-h-screen relative lg:ml-64">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Withdraw Bitcoin</h1>
            <p className="text-xs text-muted-foreground">Send Bitcoin to external address</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20">
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
            <p className="text-2xl font-bold text-bitcoin">{formatBitcoin(user.balance)} BTC</p>
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
              <Label htmlFor="address">Destination Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter Bitcoin address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount (BTC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || !address || !amount || hasActiveInvestments}
                className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Withdraw Bitcoin
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Withdrawals are processed immediately</p>
              <p>• Network fees will be deducted from your balance</p>
              <p>• Minimum withdrawal: 0.00001 BTC</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
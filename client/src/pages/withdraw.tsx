import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Send, AlertTriangle, Clock, Zap, Turtle, BookmarkPlus, History, TrendingDown, CheckCircle, XCircle, Info } from "lucide-react";
import { useLocation } from "wouter";
import { formatBitcoin, formatCurrency, formatDate } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import type { Transaction } from "@shared/schema";

type NetworkSpeed = 'slow' | 'normal' | 'fast';

export default function Withdraw() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [showAddressBook, setShowAddressBook] = useState(false);

  // TRC20 USDT has minimal network fees (around 1-2 USDT)
  const networkFee = 1; // Fixed fee in USD
  const totalAmount = amount ? parseFloat(amount) : 0;

  // Load saved addresses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('btc_saved_addresses');
    if (saved) {
      setSavedAddresses(JSON.parse(saved));
    }
  }, []);

  const { data: activeInvestments } = useQuery({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
  });

  const { data: withdrawalHistory } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: () => fetch('/api/transactions', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    }).then(data => data.filter((tx: Transaction) => tx.type === 'withdrawal')),
    enabled: !!user,
  });

  const hasActiveInvestments = activeInvestments && activeInvestments.some((inv: any) => inv.isActive);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { address: string; amount: string; networkSpeed: string }) => {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Withdrawal failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Withdrawal Submitted",
        description: `Your withdrawal of ${amount} BTC is being processed with ${networkSpeed} speed`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setAddress("");
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Check for active investments
    if (hasActiveInvestments) {
      toast({
        title: "Withdrawal Blocked",
        description: "You cannot withdraw funds while you have active investments. Please wait for your investments to complete.",
        variant: "destructive",
      });
      return;
    }

    // Validate TRC20 address format
    if (!address.startsWith('T') || address.length !== 34) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid TRC20 (TRON) address",
        variant: "destructive",
      });
      return;
    }

    const withdrawAmount = parseFloat(amount);
    const minWithdraw = 10;

    if (withdrawAmount < minWithdraw) {
      toast({
        title: "Amount Too Low",
        description: `Minimum withdrawal is $${minWithdraw} USDT`,
        variant: "destructive",
      });
      return;
    }

    // Convert balance from BTC to USD for comparison
    const balanceUSD = bitcoinPrice ? parseFloat(user.balance) * bitcoinPrice.usd.price : 0;
    
    if (withdrawAmount > balanceUSD) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds your balance",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({ address, amount });
  };

  const saveAddress = () => {
    if (!address) return;
    if (!savedAddresses.includes(address)) {
      const updated = [...savedAddresses, address];
      setSavedAddresses(updated);
      localStorage.setItem('btc_saved_addresses', JSON.stringify(updated));
      toast({
        title: "Address Saved",
        description: "Address added to your address book",
      });
    }
  };

  const selectSavedAddress = (addr: string) => {
    setAddress(addr);
    setShowAddressBook(false);
  };

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/10 to-background dark:from-background dark:via-slate-900/50 dark:to-background lg:ml-64">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/home')}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Withdraw USDT (TRC20)</h1>
              <p className="text-sm text-muted-foreground">Send USDT to TRON network address</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* TRC20 Info Banner */}
        <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  ⚡ Fast & Low-Cost Withdrawals with TRC20 USDT
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  We use TRC20 USDT on the TRON network for instant withdrawals with <span className="font-semibold">3-second processing</span> and <span className="font-semibold">network fees as low as $1</span>. Your funds arrive faster and you keep more of your profits compared to traditional networks that charge $10-$50 in fees!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="withdraw" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="withdraw">New Withdrawal</TabsTrigger>
            <TabsTrigger value="history">Withdrawal History</TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw" className="space-y-6">
            {hasActiveInvestments && (
              <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Active Investments Detected</h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        You have active investments. Withdrawing now may affect your returns.
                        Consider waiting until your investments complete to maximize profits.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Balance Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-orange-400/10 border-primary/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                  {bitcoinPrice && (
                    <>
                      <h2 className="text-4xl font-bold text-foreground mb-2">
                        ${(parseFloat(user.balance) * bitcoinPrice.usd.price).toFixed(2)} USDT
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        {formatBitcoin(user.balance)} BTC
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Withdrawal Form */}
              <div className="lg:col-span-2">
                <Card className="bg-card/50 backdrop-blur-lg border border-border shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Send className="w-5 h-5 text-primary" />
                      Withdrawal Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="address">TRON Address (TRC20)</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAddressBook(!showAddressBook)}
                              className="text-xs"
                            >
                              <BookmarkPlus className="w-3 h-3 mr-1" />
                              Address Book
                            </Button>
                            {address && !savedAddresses.includes(address) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={saveAddress}
                                className="text-xs"
                              >
                                Save Address
                              </Button>
                            )}
                          </div>
                        </div>
                        <Input
                          id="address"
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter TRON TRC20 address (starts with T)"
                          className="font-mono text-sm"
                        />

                        {showAddressBook && savedAddresses.length > 0 && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs font-medium mb-2">Saved Addresses:</p>
                            <div className="space-y-2">
                              {savedAddresses.map((addr, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => selectSavedAddress(addr)}
                                  className="w-full text-left text-xs p-2 bg-background hover:bg-primary/10 rounded border border-border transition-colors"
                                >
                                  {addr.substring(0, 10)}...{addr.substring(addr.length - 10)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="mt-2"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-muted-foreground">
                            Available: ${bitcoinPrice ? (parseFloat(user.balance) * bitcoinPrice.usd.price).toFixed(2) : '0.00'} USD
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (bitcoinPrice) {
                                setAmount((parseFloat(user.balance) * bitcoinPrice.usd.price).toFixed(2));
                              }
                            }}
                            className="text-xs"
                          >
                            Max
                          </Button>
                        </div>
                      </div>

                      {/* Network Info */}
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-primary" />
                          <span className="font-medium">Network: TRC20 (TRON)</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>• Processing Time: 1-5 minutes</p>
                          <p>• Network Fee: ~${networkFee} USDT (included)</p>
                          <p>• Min. Withdrawal: $10 USDT</p>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={withdrawMutation.isPending || !address || !amount}
                      >
                        {withdrawMutation.isPending ? "Processing..." : "Submit Withdrawal"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Summary */}
              <div className="space-y-4">
                <Card className="bg-card/50 backdrop-blur-lg border border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Transaction Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">${amount || '0.00'} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network Fee</span>
                      <span className="font-semibold text-green-600">Included</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-medium">You Will Receive</span>
                      <span className="font-bold text-lg">${totalAmount.toFixed(2)} USDT</span>
                    </div>
                    {bitcoinPrice && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Your Balance</span>
                        <span>≈ ${(parseFloat(user.balance) * bitcoinPrice.usd.price).toFixed(2)} USD</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                  <CardContent className="pt-4">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
                        <p><strong>Processing Time:</strong> 1-5 minutes (fast)</p>
                        <p><strong>Network:</strong> TRC20 (TRON Network)</p>
                        <p><strong>Token:</strong> USDT</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400">
                          Funds are deducted immediately to prevent double-spending. Please ensure your TRC20 address is correct before submitting.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-card/50 backdrop-blur-lg border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Recent Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!withdrawalHistory || withdrawalHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No withdrawal history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawalHistory.map((tx) => (
                      <div key={tx.id} className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {tx.status === 'confirmed' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : tx.status === 'rejected' ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <div>
                              <span className="font-semibold block">
                                ${bitcoinPrice ? (parseFloat(tx.amount) * bitcoinPrice.usd.price).toFixed(2) : '0.00'} USDT
                              </span>
                              <span className="text-xs text-muted-foreground">{formatBitcoin(tx.amount)} BTC</span>
                            </div>
                          </div>
                          <Badge variant={
                            tx.status === 'confirmed' ? 'default' : 
                            tx.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }>
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Date: {formatDate(new Date(tx.createdAt))}</p>
                          <p>Network: TRC20 (TRON)</p>
                          {tx.transactionHash && (
                            <p className="font-mono">
                              To: {tx.transactionHash.substring(0, 10)}...{tx.transactionHash.substring(tx.transactionHash.length - 10)}
                            </p>
                          )}
                          {tx.confirmedAt && (
                            <p>Confirmed: {formatDate(new Date(tx.confirmedAt))}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
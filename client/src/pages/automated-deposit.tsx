import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Copy, CheckCircle, Clock, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";

interface DepositSession {
  sessionToken: string;
  depositAddress: string;
  amount: string;
  status: string;
  expiresAt: string;
  timeRemaining: number;
  userConfirmedSent: boolean;
  blockchainTxHash?: string;
  confirmations?: number;
  amountReceived?: string;
  createdAt: string;
  completedAt?: string;
}

export default function AutomatedDeposit() {
  const [amount, setAmount] = useState("");
  const [currentSession, setCurrentSession] = useState<DepositSession | null>(null);
  const [step, setStep] = useState<"input" | "session" | "monitoring" | "completed">("input");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bitcoinPrice } = useBitcoinPrice();

  // Create deposit session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (depositAmount: string): Promise<DepositSession> => {
      const response = await apiRequest("POST", `/api/deposit/session`, { amount: depositAmount });
      return await response.json();
    },
    onSuccess: (session: DepositSession) => {
      setCurrentSession(session);
      setTimeRemaining(session.timeRemaining);
      setStep("session");
      toast({
        title: "✅ Deposit Session Created",
        description: `Your automated deposit session for ${session.amount} BTC has been created.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to Create Session",
        description: error.message || "Failed to create deposit session. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (sessionToken: string): Promise<{ message: string; status: string }> => {
      const response = await apiRequest("POST", `/api/deposit/session/${sessionToken}/confirm`);
      return await response.json();
    },
    onSuccess: () => {
      setStep("monitoring");
      toast({
        title: "🔍 Payment Confirmed",
        description: "We're now monitoring the blockchain for your transaction.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Confirmation Failed",
        description: error.message || "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Get session details query
  const { data: sessionDetails, refetch: refetchSession } = useQuery({
    queryKey: ['depositSession', currentSession?.sessionToken],
    queryFn: async (): Promise<DepositSession | null> => {
      if (!currentSession?.sessionToken) return null;
      const response = await apiRequest("GET", `/api/deposit/session/${currentSession.sessionToken}`);
      return await response.json();
    },
    enabled: !!currentSession?.sessionToken && (step === "monitoring" || step === "session"),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Update session data when query data changes
  useEffect(() => {
    if (sessionDetails) {
      setCurrentSession(sessionDetails);
      setTimeRemaining(sessionDetails.timeRemaining);
      
      if (sessionDetails.status === "confirmed") {
        setStep("completed");
        toast({
          title: "🎉 Deposit Completed!",
          description: `Your deposit of ${sessionDetails.amountReceived || sessionDetails.amount} BTC has been confirmed and added to your balance.`,
        });
      } else if (sessionDetails.status === "expired") {
        setStep("input");
        setCurrentSession(null);
        toast({
          title: "⏰ Session Expired",
          description: "Your deposit session has expired. Please create a new session.",
          variant: "destructive",
        });
      }
    }
  }, [sessionDetails, toast]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0 && (step === "session" || step === "monitoring")) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStep("input");
            setCurrentSession(null);
            toast({
              title: "⏰ Session Expired",
              description: "Your deposit session has expired. Please create a new session.",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, step, toast]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "❌ Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Calculate USD equivalent
  const getUsdEquivalent = (btcAmount: string): string => {
    if (!bitcoinPrice?.usd?.price) return "~";
    const usd = parseFloat(btcAmount) * bitcoinPrice.usd.price;
    return `≈ $${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "❌ Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (amountNum < 0.001) {
      toast({
        title: "❌ Amount Too Small",
        description: "Minimum deposit amount is 0.001 BTC",
        variant: "destructive",
      });
      return;
    }

    createSessionMutation.mutate(amount);
  };

  // Start new session
  const startNewSession = () => {
    setStep("input");
    setCurrentSession(null);
    setAmount("");
    setTimeRemaining(0);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">💰 Deposit Bitcoin</h1>
        <p className="text-muted-foreground">
          Send Bitcoin to your personal wallet address and get instant verification when confirmed on the blockchain
        </p>
      </div>

      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">1</div>
              Enter Deposit Amount
            </CardTitle>
            <CardDescription>
              Specify how much Bitcoin you want to deposit. We'll create a secure session for your deposit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (BTC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  min="0.001"
                  placeholder="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={createSessionMutation.isPending}
                  data-testid="input-deposit-amount"
                />
                {amount && (
                  <p className="text-sm text-muted-foreground">
                    {getUsdEquivalent(amount)}
                  </p>
                )}
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your Personal Address:</strong> This creates a 30-minute deposit session using your personal Bitcoin wallet address. 
                  Send the exact amount and confirm when sent. Your balance will be updated automatically when the transaction is confirmed on the blockchain.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={createSessionMutation.isPending || !amount}
                data-testid="button-create-session"
              >
                {createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Session...
                  </>
                ) : (
                  "Create Deposit Session"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "session" && currentSession && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                Send Bitcoin Payment
              </CardTitle>
              <CardDescription>
                Send exactly {currentSession.amount} BTC to your personal wallet address below within {formatTimeRemaining(timeRemaining)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your Personal Bitcoin Address</Label>
                <div className="flex gap-2">
                  <Input 
                    value={currentSession.depositAddress} 
                    readOnly 
                    className="font-mono text-sm"
                    data-testid="text-deposit-address"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(currentSession.depositAddress, "Deposit address")}
                    data-testid="button-copy-address"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount to Send</Label>
                <div className="flex gap-2">
                  <Input 
                    value={`${currentSession.amount} BTC`} 
                    readOnly
                    data-testid="text-amount-to-send"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(currentSession.amount, "Amount")}
                    data-testid="button-copy-amount"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getUsdEquivalent(currentSession.amount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Remaining
                </Label>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-orange-500" data-testid="text-time-remaining">
                    {formatTimeRemaining(timeRemaining)}
                  </div>
                  <Progress 
                    value={(timeRemaining / 1800) * 100} 
                    className="h-2"
                    data-testid="progress-time-remaining"
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Send exactly {currentSession.amount} BTC to your personal address above. 
                  Any other amount may not be recognized automatically. This is your secure wallet address managed by BitVault Pro.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={() => confirmPaymentMutation.mutate(currentSession.sessionToken)}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={confirmPaymentMutation.isPending}
                data-testid="button-confirm-sent"
              >
                {confirmPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    I've Sent the Payment
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={startNewSession}
                className="w-full"
                data-testid="button-cancel-session"
              >
                Cancel Session
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "monitoring" && currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</div>
              Monitoring Blockchain
            </CardTitle>
            <CardDescription>
              We're monitoring the Bitcoin blockchain for your transaction. This usually takes 1-10 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
                <p className="text-lg font-semibold">Waiting for blockchain confirmation...</p>
                <p className="text-sm text-muted-foreground">
                  Amount: {currentSession.amount} BTC ({getUsdEquivalent(currentSession.amount)})
                </p>
                {currentSession.blockchainTxHash && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Transaction Found!</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {currentSession.blockchainTxHash}
                    </p>
                    <p className="text-sm">
                      Confirmations: {currentSession.confirmations || 0}/1
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => refetchSession()}
                className="flex-1"
                data-testid="button-refresh-status"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
              <Button 
                variant="outline" 
                onClick={startNewSession}
                className="flex-1"
                data-testid="button-start-new"
              >
                Start New Deposit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "completed" && currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Deposit Completed Successfully!
            </CardTitle>
            <CardDescription>
              Your Bitcoin deposit has been confirmed and added to your balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2">
              <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                {currentSession.amountReceived || currentSession.amount} BTC deposited
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {getUsdEquivalent(currentSession.amountReceived || currentSession.amount)}
              </p>
              {currentSession.blockchainTxHash && (
                <p className="text-xs font-mono text-green-600 dark:text-green-400">
                  Transaction: {currentSession.blockchainTxHash}
                </p>
              )}
            </div>

            <Button 
              onClick={startNewSession}
              className="w-full bg-orange-500 hover:bg-orange-600"
              data-testid="button-new-deposit"
            >
              Make Another Deposit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
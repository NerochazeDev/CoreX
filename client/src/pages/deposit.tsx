import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Copy, Check, QrCode, Wallet, Send, Info, Zap, Shield, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface AdminConfig {
  vaultAddress: string;
  depositAddress: string;
}

// Simple QR Code component (you can replace with a proper QR library)
function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <div className="flex justify-center p-4 bg-white rounded-lg">
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        width={size} 
        height={size}
        className="rounded"
      />
    </div>
  );
}

export default function Deposit() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [selectedTab, setSelectedTab] = useState<'vault' | 'instant'>('instant');
  const [showQR, setShowQR] = useState(false);

  // Fetch admin configuration for deposit addresses
  const { data: adminConfig } = useQuery<AdminConfig>({
    queryKey: ['/api/admin/config'],
    queryFn: () => fetch('/api/admin/config').then(res => res.json()),
  });

  // Fetch recent deposit transactions
  const { data: recentDeposits } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => fetch('/api/transactions').then(res => res.json()),
    select: (data: any[]) => data.filter(tx => tx.type === 'deposit').slice(0, 3),
  });

  // Submit deposit transaction
  const submitDepositMutation = useMutation({
    mutationFn: async (data: { amount: string; transactionHash?: string }) => {
      console.log('Submitting deposit:', data);

      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(data),
      });

      console.log('Deposit response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.log('Deposit error response:', error);
        throw new Error(error.error || 'Deposit submission failed');
      }

      const result = await response.json();
      console.log('Deposit success response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Deposit mutation success:', data);
      toast({
        title: "Deposit Submitted Successfully! 🎉",
        description: "Your deposit is being processed and will be confirmed shortly.",
      });
      setAmount("");
      setTransactionHash("");
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      console.error('Deposit mutation error:', error);

      let errorMessage = error.message;
      let errorTitle = "Deposit Submission Failed";

      // Handle specific error cases
      if (error.message.includes("Authentication required")) {
        errorTitle = "Authentication Required";
        errorMessage = "Please log in again to continue.";
      } else if (error.message.includes("Minimum deposit")) {
        errorTitle = "Amount Too Small";
        errorMessage = "Minimum deposit amount is 0.001 BTC (~$104).";
      } else if (error.message.includes("Invalid amount")) {
        errorTitle = "Invalid Amount";
        errorMessage = "Please enter a valid Bitcoin amount.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: "Copied! 📋",
        description: `${type} address copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <div>Please log in to access deposits</div>;
  }

  const currentAddress = selectedTab === 'vault' ? adminConfig?.vaultAddress : adminConfig?.depositAddress;

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border bg-gradient-to-r from-bitcoin/5 to-transparent">
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
            <h1 className="text-xl font-bold text-foreground">Deposit Bitcoin</h1>
            <p className="text-xs text-muted-foreground">Secure & Instant Funding</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-6">
        {/* Step-by-Step Guide */}
        <Card className="neo-card rounded-2xl p-6 mb-6 bg-gradient-to-br from-bitcoin/5 to-emerald/5">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-bitcoin" />
            How to Deposit Bitcoin
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-bitcoin text-black text-sm font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <p className="font-medium text-foreground">Choose Your Deposit Method</p>
                <p className="text-sm text-muted-foreground">Select instant deposit for trading or vault for long-term storage</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald text-black text-sm font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <p className="font-medium text-foreground">Copy the Address or Scan QR Code</p>
                <p className="text-sm text-muted-foreground">Use your Bitcoin wallet to send to our secure address</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sapphire text-white text-sm font-bold flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <p className="font-medium text-foreground">Submit Your Deposit</p>
                <p className="text-sm text-muted-foreground">Enter amount and transaction hash for faster confirmation</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Deposit Method Selector */}
        <div className="bg-muted p-1 rounded-xl mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setSelectedTab('instant')}
              className={`py-4 px-4 rounded-lg text-sm font-medium transition-all ${
                selectedTab === 'instant' 
                  ? 'bg-background text-foreground shadow-lg neo-card' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-6 h-6" />
                <span>Instant Deposit</span>
                <span className="text-xs opacity-75">For Trading</span>
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('vault')}
              className={`py-4 px-4 rounded-lg text-sm font-medium transition-all ${
                selectedTab === 'vault' 
                  ? 'bg-background text-foreground shadow-lg neo-card' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-6 h-6" />
                <span>Secure Vault</span>
                <span className="text-xs opacity-75">Long-term Storage</span>
              </div>
            </button>
          </div>
        </div>

        {/* Deposit Address Card */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedTab === 'instant' ? (
                  <Zap className="w-5 h-5 text-bitcoin" />
                ) : (
                  <Shield className="w-5 h-5 text-bitcoin" />
                )}
                {selectedTab === 'instant' ? 'Instant Deposit' : 'Investment Vault'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQR(!showQR)}
                className="h-8 px-2"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* QR Code Display */}
              {showQR && currentAddress && (
                <div className="border rounded-lg p-4 bg-white">
                  <QRCodeDisplay value={currentAddress} size={180} />
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Scan with your Bitcoin wallet
                  </p>
                </div>
              )}

              {/* Address Input */}
              <div>
                <Label className="text-xs text-muted-foreground">
                  {selectedTab === 'instant' ? 'Instant Deposit Address' : 'Vault Address'}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={currentAddress || "Loading..."}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => currentAddress && copyToClipboard(currentAddress, selectedTab === 'instant' ? 'Instant' : 'Vault')}
                    disabled={!currentAddress}
                  >
                    {copied === (selectedTab === 'instant' ? 'Instant' : 'Vault') ? 
                      <Check className="w-4 h-4 text-green-500" /> : 
                      <Copy className="w-4 h-4" />
                    }
                  </Button>
                </div>
              </div>

              {/* Method Description */}
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-xl border border-muted">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${selectedTab === 'instant' ? 'bg-bitcoin/20' : 'bg-emerald/20'} flex items-center justify-center flex-shrink-0`}>
                    {selectedTab === 'instant' ? (
                      <Zap className="w-5 h-5 text-bitcoin" />
                    ) : (
                      <Shield className="w-5 h-5 text-emerald" />
                    )}
                  </div>
                  <div className="text-sm space-y-2">
                    {selectedTab === 'instant' ? (
                      <>
                        <p className="font-bold text-foreground text-base">⚡ Instant Deposit</p>
                        <div className="space-y-1 text-muted-foreground">
                          <p>✅ Balance updates within 1 confirmation (~10 mins)</p>
                          <p>✅ Perfect for active trading and investments</p>
                          <p>✅ Start earning profits immediately</p>
                          <p>✅ Minimum deposit: 0.001 BTC</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-foreground text-base">🔒 Secure Vault</p>
                        <div className="space-y-1 text-muted-foreground">
                          <p>✅ Multi-signature protection (2-of-3)</p>
                          <p>✅ Cold storage security</p>
                          <p>✅ Ideal for large amounts (1+ BTC)</p>
                          <p>✅ Enhanced insurance coverage</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Deposit */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-bitcoin" />
              Submit Deposit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (BTC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: 0.001 BTC (~$104)
                </p>
              </div>

              <div>
                <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
                <Input
                  id="txHash"
                  placeholder="Enter your transaction hash for faster processing"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Adding your transaction hash speeds up confirmation
                </p>
              </div>

              <Button 
                onClick={() => {
                  // Client-side validation
                  const amountNum = parseFloat(amount);
                  if (!amount || isNaN(amountNum)) {
                    toast({
                      title: "Invalid Amount",
                      description: "Please enter a valid Bitcoin amount.",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (amountNum < 0.001) {
                    toast({
                      title: "Amount Too Small",
                      description: "Minimum deposit amount is 0.001 BTC.",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (amountNum > 10) {
                    toast({
                      title: "Large Amount Warning",
                      description: "For deposits over 10 BTC, please contact support first.",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Proceed with submission
                  submitDepositMutation.mutate({ amount, transactionHash });
                }}
                disabled={!amount || parseFloat(amount) < 0.001 || submitDepositMutation.isPending}
                className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black font-semibold"
              >
                {submitDepositMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Deposit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deposits */}
        {recentDeposits && recentDeposits.length > 0 && (
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recent Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDeposits.map((deposit: any, index: number) => (
                  <div key={deposit.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-sm font-medium">{deposit.amount} BTC</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deposit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        deposit.status === 'confirmed' ? 'default' : 
                        deposit.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {deposit.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Features */}
        <Card className="dark-card dark-border">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-bitcoin" />
              Security & Processing
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Auto-confirmation</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">24/7 Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Instant Updates</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
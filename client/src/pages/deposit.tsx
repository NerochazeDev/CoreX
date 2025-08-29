import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Copy, Check, QrCode, Wallet, Send, Info, Zap, Shield, Clock, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useCurrency } from "@/hooks/use-currency";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { formatCurrency, formatBitcoin, convertFiatToBTC, convertBTCToFiat } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [inputMode, setInputMode] = useState<'BTC' | 'FIAT'>('BTC');
  const [fiatAmount, setFiatAmount] = useState("");
  
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();

  // Fetch admin configuration for deposit addresses
  const { data: adminConfig } = useQuery<AdminConfig>({
    queryKey: ['/api/admin/config'],
  });

  // Fetch recent deposit transactions
  const { data: recentDeposits } = useQuery({
    queryKey: ['/api/transactions'],
    select: (data: any[]) => data?.filter(tx => tx.type === 'deposit').slice(0, 3) || [],
  });

  // Submit deposit transaction
  const submitDepositMutation = useMutation({
    mutationFn: async (data: { amount: string; transactionHash?: string }) => {


      const response = await apiRequest('POST', '/api/deposit', data);
      const result = await response.json();
      

      return result;
    },
    onSuccess: (data) => {

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
    <div className="max-w-sm mx-auto lg:max-w-4xl bg-background min-h-screen relative lg:ml-64">
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
        {/* Automated Deposit Promotion */}
        <Card className="neo-card rounded-2xl border-gradient-to-r from-orange-500/20 to-yellow-500/20 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/10 dark:to-yellow-950/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-orange-600 dark:text-orange-400 mb-1">
                  🚀 New: Automated Deposit System
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Send Bitcoin and get instant verification when confirmed on the blockchain. 
                  No waiting for manual approval - completely automated with 30-minute sessions!
                </p>
                <Button 
                  onClick={() => setLocation('/deposit/automated')}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0"
                  size="sm"
                  data-testid="button-automated-deposit"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Try Automated Deposit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Instructions */}
        <Card className="neo-card rounded-2xl p-6 mb-6 bg-gradient-to-br from-bitcoin/10 to-emerald/10 border-bitcoin/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-bitcoin/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-bitcoin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Quick Deposit Guide</h3>
              <p className="text-sm text-muted-foreground">Follow these 3 simple steps</p>
            </div>
          </div>
          
          <div className="bg-white/50 dark:bg-slate-900/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bitcoin text-black text-sm font-bold flex items-center justify-center flex-shrink-0">1</div>
              <p className="text-sm font-medium text-foreground">Choose your deposit method below</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bitcoin text-black text-sm font-bold flex items-center justify-center flex-shrink-0">2</div>
              <p className="text-sm font-medium text-foreground">Send Bitcoin to the address shown</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bitcoin text-black text-sm font-bold flex items-center justify-center flex-shrink-0">3</div>
              <p className="text-sm font-medium text-foreground">Enter amount & transaction hash for faster confirmation</p>
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

        {/* Prominent Deposit Address - Step 2 */}
        <Card className="dark-card dark-border border-bitcoin/30 shadow-lg shadow-bitcoin/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bitcoin text-black text-lg font-bold flex items-center justify-center">2</div>
                <div>
                  <div className="flex items-center gap-2">
                    {selectedTab === 'instant' ? (
                      <Zap className="w-5 h-5 text-bitcoin" />
                    ) : (
                      <Shield className="w-5 h-5 text-bitcoin" />
                    )}
                    <span className="text-lg">Send Bitcoin to This Address</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal">
                    {selectedTab === 'instant' ? 'Instant Deposit Address' : 'Secure Vault Address'}
                  </p>
                </div>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                {showQR ? 'Hide QR' : 'Show QR'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Important Notice */}
            <div className="bg-gradient-to-r from-bitcoin/10 to-emerald/10 border border-bitcoin/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Info className="w-5 h-5 text-bitcoin flex-shrink-0" />
                <p className="font-semibold text-foreground">Send Bitcoin to this address first</p>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                After sending, enter the amount and transaction hash below for faster confirmation
              </p>
            </div>

            {/* QR Code Display */}
            {showQR && currentAddress && (
              <div className="border-2 border-bitcoin/20 rounded-xl p-6 bg-white text-center">
                <QRCodeDisplay value={currentAddress} size={200} />
                <p className="text-sm text-muted-foreground mt-3 font-medium">
                  Scan with your Bitcoin wallet app
                </p>
              </div>
            )}

            {/* Prominent Address Display */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Bitcoin Deposit Address
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={currentAddress || "Loading address..."}
                  readOnly
                  className="text-sm font-mono bg-muted/50 border-2 focus:border-bitcoin/50 text-center py-3"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => currentAddress && copyToClipboard(currentAddress, selectedTab === 'instant' ? 'Instant' : 'Vault')}
                  disabled={!currentAddress}
                  className="h-12 w-12 border-2 hover:border-bitcoin/50"
                >
                  {copied === (selectedTab === 'instant' ? 'Instant' : 'Vault') ? 
                    <Check className="w-5 h-5 text-green-500" /> : 
                    <Copy className="w-5 h-5" />
                  }
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ Only send Bitcoin (BTC) to this address. Other cryptocurrencies will be lost.
              </p>
            </div>

            {/* Method Benefits */}
            <div className="bg-gradient-to-r from-muted/30 to-muted/20 p-4 rounded-xl border">
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
                      <p className="font-bold text-foreground">⚡ Instant Deposit Benefits</p>
                      <div className="space-y-1 text-muted-foreground">
                        <p>• Balance updates within 1 confirmation (~10 mins)</p>
                        <p>• Perfect for active trading and investments</p>
                        <p>• Start earning profits immediately</p>
                        <p>• Minimum: 0.001 BTC</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-foreground">🔒 Secure Vault Benefits</p>
                      <div className="space-y-1 text-muted-foreground">
                        <p>• Multi-signature protection (2-of-3)</p>
                        <p>• Cold storage security</p>
                        <p>• Ideal for large amounts (1+ BTC)</p>
                        <p>• Enhanced insurance coverage</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Deposit - Step 3 */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald text-black text-lg font-bold flex items-center justify-center">3</div>
              <div>
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-bitcoin" />
                  <span>Confirm Your Deposit</span>
                </div>
                <p className="text-sm text-muted-foreground font-normal">Enter details after sending Bitcoin</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Important Notice */}
              <div className="bg-gradient-to-r from-emerald/10 to-sapphire/10 border border-emerald/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-emerald flex-shrink-0" />
                  <p className="font-semibold text-foreground">Complete this after sending Bitcoin</p>
                </div>
                <p className="text-sm text-muted-foreground ml-8">
                  Fill out the form below with your transaction details for faster processing and confirmation
                </p>
              </div>
              {/* Dual Currency Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Deposit Amount</Label>
                  <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'BTC' | 'FIAT')} className="w-auto">
                    <TabsList className="h-8">
                      <TabsTrigger value="BTC" className="text-xs px-3 py-1">BTC</TabsTrigger>
                      <TabsTrigger value="FIAT" className="text-xs px-3 py-1">{currency}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {inputMode === 'BTC' ? (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      step="0.00000001"
                      placeholder="0.00100000"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (e.target.value && bitcoinPrice) {
                          const currentPriceData = currency === 'USD' ? bitcoinPrice.usd : currency === 'GBP' ? bitcoinPrice.gbp : bitcoinPrice.eur;
                          const fiatValue = convertBTCToFiat(e.target.value, currentPriceData.price);
                          setFiatAmount(fiatValue.toFixed(2));
                        } else {
                          setFiatAmount("");
                        }
                      }}
                      className="text-lg font-mono"
                    />
                    {fiatAmount && bitcoinPrice && (
                      <p className="text-sm text-muted-foreground">
                        ≈ {formatCurrency(parseFloat(fiatAmount), currency)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={currency === 'USD' ? '104.00' : currency === 'GBP' ? '82.00' : '95.00'}
                        value={fiatAmount}
                        onChange={(e) => {
                          setFiatAmount(e.target.value);
                          if (e.target.value && bitcoinPrice) {
                            const currentPriceData = currency === 'USD' ? bitcoinPrice.usd : currency === 'GBP' ? bitcoinPrice.gbp : bitcoinPrice.eur;
                            const btcValue = convertFiatToBTC(parseFloat(e.target.value), currentPriceData.price);
                            setAmount(btcValue.toFixed(8));
                          } else {
                            setAmount("");
                          }
                        }}
                        className="text-lg pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€'}
                      </span>
                    </div>
                    {amount && (
                      <p className="text-sm text-muted-foreground">
                        ≈ {formatBitcoin(amount)} BTC
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum: 0.001 BTC {bitcoinPrice && (
                    `(${formatCurrency(convertBTCToFiat(0.001, currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)})`
                  )}
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
                      <p className="text-sm font-medium">
                        {formatBitcoin(deposit.amount, { compact: true })} BTC
                        {bitcoinPrice && (
                          <span className="text-muted-foreground ml-2">
                            (≈ {formatCurrency(convertBTCToFiat(deposit.amount, currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)})
                          </span>
                        )}
                      </p>
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
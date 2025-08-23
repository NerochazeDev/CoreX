
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, QrCode, AlertCircle, CheckCircle, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BottomNavigation from "@/components/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { toastMessages } from "@/lib/toast-messages";

export default function Deposit() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [amount, setAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hardcoded deposit address for demonstration
  const depositAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast(toastMessages.success.addressCopied());
  };

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; transactionHash: string }) => {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast(toastMessages.success.depositSubmitted());
      setAmount("");
      setTransactionHash("");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => {
      toast(toastMessages.error.depositFailed(error.message));
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !transactionHash) {
      toast(toastMessages.error.validation("Please fill in all required fields"));
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast(toastMessages.error.validation("Amount must be greater than 0"));
      return;
    }

    setIsSubmitting(true);
    depositMutation.mutate({ amount, transactionHash });
  };

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen">
      <header className="px-4 py-6 border-b dark-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/home')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Deposit Bitcoin</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Deposit Address Section - Prominently Displayed */}
        <Card className="dark-card border-bitcoin/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-bitcoin" />
              <CardTitle className="text-lg text-bitcoin">Deposit Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address Display */}
            <div className="bg-muted/50 rounded-lg p-4 border border-bitcoin/20">
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Bitcoin Address
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-background rounded px-2 py-1 border text-foreground break-all">
                  {depositAddress}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(depositAddress)}
                  className="shrink-0 border-bitcoin/30 hover:bg-bitcoin/10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-muted/30 rounded-lg border-2 border-dashed border-bitcoin/30 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-bitcoin/50" />
              </div>
            </div>

            {/* Important Instructions */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-500 mb-1">How to Deposit</p>
                  <p className="text-muted-foreground">
                    Send Bitcoin to the address above, then enter the amount and transaction hash below for faster confirmation.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge variant="outline" className="border-green-500/30 text-green-500 text-xs">
                  ⚡ Fast confirmation with TXID
                </Badge>
                <Badge variant="outline" className="border-bitcoin/30 text-bitcoin text-xs">
                  🔒 Secure network
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="dark-border" />

        {/* Deposit Form */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="text-lg">Confirm Your Deposit</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the details after sending Bitcoin to speed up confirmation
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Sent (BTC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  min="0"
                  placeholder="0.00000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionHash">Transaction Hash (TXID)</Label>
                <Input
                  id="transactionHash"
                  type="text"
                  placeholder="Enter transaction hash for verification"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your wallet after sending the transaction
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-bitcoin hover:bg-bitcoin/90"
                disabled={isSubmitting || !amount || !transactionHash}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Confirm Deposit
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Network Info */}
        <Card className="dark-card dark-border">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Network</span>
                <span className="text-bitcoin font-medium">Bitcoin Mainnet</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum Deposit</span>
                <span>0.00000001 BTC</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmations</span>
                <span>1 network confirmation</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Time</span>
                <span>5-30 minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}

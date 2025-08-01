import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Wallet, Plus, Download, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WalletSetup() {
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createWalletMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-wallet", { userId: user?.id });
      return res.json();
    },
    onSuccess: async () => {
      toast({
        title: "Wallet Created Successfully",
        description: "Your new Bitcoin wallet has been created and secured.",
      });
      await refreshUser();
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Wallet Creation Failed", 
        description: error.message || "Failed to create wallet",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }
    
    // If user already has a wallet, redirect to home
    if (user.hasWallet) {
      setLocation('/');
    }
  }, [user, setLocation]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  if (user.hasWallet) {
    return <div>Redirecting to home...</div>;
  }

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bitcoin flex items-center justify-center">
            <Wallet className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Setup Your Wallet</h1>
            <p className="text-xs text-muted-foreground">Choose how you want to get started</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-6">
        {/* Welcome Message */}
        <Card className="dark-card dark-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-bitcoin/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-bitcoin" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Welcome to Plus500 VIP</h3>
              <p className="text-sm text-muted-foreground">
                To start using Plus500 VIP, you need to set up your Bitcoin wallet. Choose one of the options below to continue.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Create New Wallet */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-bitcoin" />
              Create New Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a new Bitcoin wallet with a fresh address and secure private key. Perfect for new users.
              </p>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Generates a unique Bitcoin address</p>
                <p>• Creates secure private key automatically</p>
                <p>• Ready to receive Bitcoin immediately</p>
                <p>• Fully managed and secured</p>
              </div>

              <Button 
                onClick={() => createWalletMutation.mutate()}
                disabled={createWalletMutation.isPending}
                className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black font-semibold"
              >
                {createWalletMutation.isPending ? "Creating Wallet..." : "Create New Wallet"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Existing Wallet */}
        <Card className="dark-card dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-bitcoin" />
              Import Existing Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Already have a Bitcoin wallet? Import it using your private key or seed phrase to access your existing funds.
              </p>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Supports private keys and seed phrases</p>
                <p>• Compatible with most Bitcoin wallets</p>
                <p>• Access your existing Bitcoin balance</p>
                <p>• Secure import process</p>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/import-wallet')}
              >
                <Download className="w-4 h-4 mr-2" />
                Import Existing Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="dark-card dark-border">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-foreground">Security & Privacy</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Your wallet is secured with industry-standard encryption</p>
              <p>• Private keys are stored securely and never transmitted</p>
              <p>• Only you have access to your Bitcoin funds</p>
              <p>• Regular security audits ensure your safety</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
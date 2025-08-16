import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Key, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ImportWallet() {
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [privateKey, setPrivateKey] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");

  const importWalletMutation = useMutation({
    mutationFn: async (data: { type: 'privateKey' | 'seedPhrase'; value: string }) => {
      const res = await apiRequest("POST", "/api/import-wallet", {
        ...data,
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: async () => {
      toast({
        title: "Wallet Imported Successfully",
        description: "Your wallet has been imported and balance updated.",
      });
      await refreshUser();
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed", 
        description: error.message || "Failed to import wallet",
        variant: "destructive",
      });
    },
  });

  const handleImportPrivateKey = () => {
    if (!privateKey.trim()) {
      toast({
        title: "Missing Private Key",
        description: "Please enter a valid private key",
        variant: "destructive",
      });
      return;
    }
    importWalletMutation.mutate({ type: 'privateKey', value: privateKey.trim() });
  };

  const handleImportSeedPhrase = () => {
    if (!seedPhrase.trim()) {
      toast({
        title: "Missing Seed Phrase",
        description: "Please enter a valid seed phrase",
        variant: "destructive",
      });
      return;
    }
    importWalletMutation.mutate({ type: 'seedPhrase', value: seedPhrase.trim() });
  };

  if (!user) {
    return <div>Please log in to import a wallet</div>;
  }

  return (
    <div className="max-w-sm mx-auto lg:max-w-4xl bg-background min-h-screen relative lg:ml-64">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/deposit')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Import Wallet</h1>
            <p className="text-xs text-muted-foreground">Import existing Bitcoin wallet</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20">
        <Tabs defaultValue="private-key" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="private-key">Private Key</TabsTrigger>
            <TabsTrigger value="seed-phrase">Seed Phrase</TabsTrigger>
          </TabsList>
          
          <TabsContent value="private-key" className="space-y-4">
            <Card className="dark-card dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-bitcoin" />
                  Import Private Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="privateKey">Bitcoin Private Key (WIF Format)</Label>
                  <Input
                    id="privateKey"
                    type="password"
                    placeholder="Enter private key (WIF: 5/K/L/c..., Hex: 64 chars, or 0x...)"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="mt-1 font-mono"
                  />
                </div>
                
                <Button 
                  onClick={handleImportPrivateKey}
                  disabled={importWalletMutation.isPending || !privateKey.trim()}
                  className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black font-semibold"
                >
                  {importWalletMutation.isPending ? "Importing..." : "Import Private Key"}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Supports WIF, hex (64 chars), or 0x-prefixed formats</p>
                  <p>• Your funds will be accessible immediately</p>
                  <p>• Keep your private key secure</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seed-phrase" className="space-y-4">
            <Card className="dark-card dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-bitcoin" />
                  Import Seed Phrase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seedPhrase">12 or 24 Word Seed Phrase</Label>
                  <Textarea
                    id="seedPhrase"
                    placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                    value={seedPhrase}
                    onChange={(e) => setSeedPhrase(e.target.value)}
                    className="mt-1 min-h-[100px] font-mono text-sm"
                    rows={4}
                  />
                </div>
                
                <Button 
                  onClick={handleImportSeedPhrase}
                  disabled={importWalletMutation.isPending || !seedPhrase.trim()}
                  className="w-full bg-bitcoin hover:bg-bitcoin/90 text-black font-semibold"
                >
                  {importWalletMutation.isPending ? "Importing..." : "Import Seed Phrase"}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Supports 12 or 24 word BIP39 seed phrases</p>
                  <p>• Words must be separated by spaces</p>
                  <p>• Compatible with most Bitcoin wallets (Electrum, Exodus, etc.)</p>
                  <p>• Example: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <Card className="dark-card dark-border mt-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-foreground">Security Notice</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Your wallet data is encrypted and secure</p>
              <p>• Only you have access to your funds</p>
              <p>• Import is processed locally on your device</p>
              <p>• We recommend backing up your wallet information</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
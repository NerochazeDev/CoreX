import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Clock, Bitcoin, TrendingUp, CheckCircle, XCircle, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatBitcoin, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });

  // Cancel transaction mutation
  const cancelTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await fetch(`/api/transactions/${transactionId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Cancelled",
        description: "Your transaction has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Cancel Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to view transactions.</p>
        </div>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Bitcoin className="w-4 h-4" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-500';
      case 'investment':
        return 'text-blue-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header - Match Other Pages Style */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/history')}
                className="h-10 w-10 p-0 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200 border border-orange-200/50 dark:border-orange-700/50 shadow-md transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">Transaction History</h1>
                <p className="text-sm text-orange-600/80 dark:text-orange-400/80 font-medium">View your deposits and investments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {/* Desktop Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column - Main Content (Desktop: 9 cols, Mobile: Full width) */}
          <div className="xl:col-span-9 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-lg border border-border shadow-lg rounded-2xl animate-pulse">
                <div className="h-24 bg-muted rounded-2xl"></div>
              </Card>
            ))}
          </div>
        ) : transactions?.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-lg border border-border shadow-lg rounded-2xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Transactions</h3>
              <p className="text-sm text-muted-foreground mb-6">You haven't made any deposits or investments yet.</p>
              <Button onClick={() => setLocation('/deposit')} className="bg-primary hover:bg-primary/90">
                Make a Deposit
              </Button>
            </CardContent>
          </Card>
        ) : (
          transactions?.map((transaction) => (
            <Card key={transaction.id} className="bg-card/50 backdrop-blur-lg border border-border shadow-lg rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={getTransactionColor(transaction.type)}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <CardTitle className="text-sm text-foreground capitalize">
                        {transaction.type}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(transaction.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.status)}
                    {getStatusBadge(transaction.status)}
                    {transaction.status === 'pending' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 h-6 px-2"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this {transaction.type} of {formatBitcoin(transaction.amount)} BTC? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Transaction</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelTransactionMutation.mutate(transaction.id)}
                              disabled={cancelTransactionMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {cancelTransactionMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Amount</span>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{formatBitcoin(transaction.amount)} BTC</div>
                    </div>
                  </div>

                  {transaction.planId && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Investment Plan</span>
                      <span className="text-sm text-foreground">Plan #{transaction.planId}</span>
                    </div>
                  )}

                  {transaction.transactionHash && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Transaction Hash</span>
                      <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                        {transaction.transactionHash}
                      </div>
                    </div>
                  )}

                  {transaction.status === 'confirmed' && transaction.confirmedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Confirmed</span>
                      <span className="text-sm text-green-600">{formatDate(new Date(transaction.confirmedAt))}</span>
                    </div>
                  )}

                  {transaction.status === 'rejected' && transaction.notes && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Rejection Reason</span>
                      <div className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded">
                        {transaction.notes}
                      </div>
                    </div>
                  )}

                  {transaction.status === 'pending' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-2 rounded text-xs">
                      Your transaction is under review and will be processed shortly. You will be notified once completed.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
          </div>

          {/* Right Sidebar (Desktop Only) */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Quick Actions */}
            <div className="relative">
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
              <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-orange-800 dark:text-orange-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setLocation('/deposit/automated')}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl shadow-lg"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    New Deposit
                  </Button>
                  <Button
                    onClick={() => setLocation('/investment')}
                    variant="outline"
                    className="w-full h-12 border-orange-300 text-orange-700 hover:bg-orange-500 hover:text-white dark:border-orange-600 dark:text-orange-300 font-medium rounded-xl"
                  >
                    <Bitcoin className="w-4 h-4 mr-2" />
                    Invest Now
                  </Button>
                  <Button
                    onClick={() => setLocation('/history')}
                    variant="outline"
                    className="w-full h-12 border-orange-300 text-orange-700 hover:bg-orange-500 hover:text-white dark:border-orange-600 dark:text-orange-300 font-medium rounded-xl"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Full History
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Summary */}
            <div className="relative">
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
              <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-orange-800 dark:text-orange-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-600 dark:text-orange-400">Total Transactions:</span>
                      <span className="font-medium text-orange-800 dark:text-orange-200">{transactions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600 dark:text-orange-400">Confirmed:</span>
                      <span className="font-medium text-green-600">{transactions?.filter(t => t.status === 'confirmed').length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600 dark:text-orange-400">Pending:</span>
                      <span className="font-medium text-yellow-600">{transactions?.filter(t => t.status === 'pending').length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
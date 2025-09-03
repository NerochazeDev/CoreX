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
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/10 to-background dark:from-background dark:via-slate-900/50 dark:to-background lg:ml-64">
      {/* Modern Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/history')}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Transaction History</h1>
              <p className="text-sm text-muted-foreground">View your deposits and investments</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-6">
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

      <BottomNavigation />
    </div>
  );
}
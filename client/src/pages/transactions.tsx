import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Clock, Bitcoin, TrendingUp, CheckCircle, XCircle, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="px-4 py-6 border-b dark-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/history')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Transaction History</h1>
            <p className="text-xs text-muted-foreground">View your deposits and investments</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="dark-card dark-border animate-pulse">
                <div className="h-24 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        ) : transactions?.length === 0 ? (
          <Card className="dark-card dark-border">
            <CardContent className="pt-6 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Transactions</h3>
              <p className="text-sm text-muted-foreground mb-4">You haven't made any deposits or investments yet.</p>
              <Button onClick={() => setLocation('/deposit')} className="bg-bitcoin hover:bg-bitcoin/90">
                Make a Deposit
              </Button>
            </CardContent>
          </Card>
        ) : (
          transactions?.map((transaction) => (
            <Card key={transaction.id} className="dark-card dark-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={getTransactionColor(transaction.type)}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <CardTitle className="text-sm dark-text capitalize">
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Amount</span>
                    <div className="text-right">
                      <div className="font-semibold dark-text">{formatBitcoin(transaction.amount)} BTC</div>
                    </div>
                  </div>

                  {transaction.planId && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Investment Plan</span>
                      <span className="text-sm dark-text">Plan #{transaction.planId}</span>
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
                    <div className="space-y-2">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-2 rounded text-xs">
                        Your transaction is under review and will be processed shortly. You will be notified once completed.
                      </div>
                      <Button
                        onClick={() => cancelTransactionMutation.mutate(transaction.id)}
                        disabled={cancelTransactionMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {cancelTransactionMutation.isPending ? "Cancelling..." : "Cancel Transaction"}
                      </Button>
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
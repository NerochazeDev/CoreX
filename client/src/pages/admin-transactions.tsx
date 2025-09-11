import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Check, X, Clock, Bitcoin, TrendingUp, ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatBitcoin, formatDate } from "@/lib/utils";
import type { Transaction } from "@shared/schema";

export default function ManagementTransactions() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [notes, setNotes] = useState("");

  // Require proper admin authentication

  // Fetch pending transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions/pending'],
    enabled: !!user?.isAdmin,
    queryFn: async () => {
      const response = await fetch('/api/admin/transactions/pending', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // Confirm transaction mutation
  const confirmTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, notes }: { transactionId: number; notes?: string }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      const response = await fetch('/api/admin/transactions/confirm', {
        method: 'POST',
        headers,
        body: JSON.stringify({ transactionId, notes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Confirmed",
        description: "Transaction has been confirmed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions/pending'] });
      setSelectedTransaction(null);
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject transaction mutation
  const rejectTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, notes }: { transactionId: number; notes?: string }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      const response = await fetch('/api/admin/transactions/reject', {
        method: 'POST',
        headers,
        body: JSON.stringify({ transactionId, notes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Rejected",
        description: "Transaction has been rejected successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions/pending'] });
      setSelectedTransaction(null);
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Bitcoin className="w-4 h-4" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4" />;
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
      case 'withdrawal':
        return 'text-red-500';
      case 'investment':
        return 'text-blue-500';
      default:
        return 'text-yellow-500';
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
            onClick={() => setLocation('/admin')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Pending Transactions</h1>
            <p className="text-xs text-muted-foreground">Review and confirm user transactions</p>
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
              <h3 className="font-semibold text-foreground mb-2">No Pending Transactions</h3>
              <p className="text-sm text-muted-foreground">All transactions have been processed.</p>
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
                        User ID: {transaction.userId}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
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
                      <span className="text-muted-foreground text-sm">Plan ID</span>
                      <span className="text-sm dark-text">{transaction.planId}</span>
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

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Submitted</span>
                    <span className="text-sm dark-text">{formatDate(new Date(transaction.createdAt))}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => confirmTransactionMutation.mutate({ transactionId: transaction.id })}
                      disabled={confirmTransactionMutation.isPending || rejectTransactionMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setNotes("");
                      }}
                      disabled={confirmTransactionMutation.isPending || rejectTransactionMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Rejection Modal */}
        {selectedTransaction && (
          <Card className="dark-card dark-border border-red-500">
            <CardHeader>
              <CardTitle className="text-red-500">Reject Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Transaction: {selectedTransaction.type} - {formatBitcoin(selectedTransaction.amount)} BTC
                  </p>
                  <Label htmlFor="rejection-notes">Rejection Reason (Optional)</Label>
                  <Textarea
                    id="rejection-notes"
                    placeholder="Enter reason for rejection..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => rejectTransactionMutation.mutate({ 
                      transactionId: selectedTransaction.id, 
                      notes: notes || undefined 
                    })}
                    disabled={rejectTransactionMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    {rejectTransactionMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedTransaction(null);
                      setNotes("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
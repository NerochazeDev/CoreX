import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoinAmount } from "@/lib/bitcoin";
import { ArrowLeft, Clock, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { formatBitcoin, formatCurrency, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import type { Investment, Transaction, Notification } from "@shared/schema";
import { useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { format } from 'date-fns';
import { Activity, Award } from "lucide-react";

export default function History() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/investments/user/${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch investments');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
  });

  const { data: notifications, isLoading: loadingNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch(`/api/transactions`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
  });

    const { data: investmentPlans } = useQuery({
        queryKey: ['/api/investment-plans'],
        queryFn: () => fetch('/api/investment-plans').then(res => res.json()),
    });

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
    return <div>Please log in to view your history</div>;
  }

  return (
    <div className="min-h-screen dark-bg">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold dark-text">History</h1>
              <p className="text-muted-foreground text-sm">Transaction history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark-text mb-2">Transaction History</h1>
          <p className="text-muted-foreground">Your investment and transaction history</p>
        </div>

        {isLoading || loadingNotifications || loadingTransactions ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="dark-card dark-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
            <h3 className="text-lg font-semibold dark-text">Transaction History</h3>

            {/* All transactions including investment history */}
            <div className="space-y-3">
              {/* Recent transactions from API */}
              {Array.isArray(transactions) && transactions.length > 0 ? transactions.map((transaction) => {
                const getTransactionIcon = (type: string, status: string) => {
                  if (type === 'deposit') return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
                  if (type === 'withdrawal') return <ArrowUpRight className="w-4 h-4 text-red-500" />;
                  if (type === 'investment') return <TrendingUp className="w-4 h-4 text-blue-500" />;
                  return <Activity className="w-4 h-4 text-gray-500" />;
                };

                const getStatusColor = (status: string) => {
                  if (status === 'confirmed') return 'text-green-500';
                  if (status === 'pending') return 'text-yellow-500';
                  if (status === 'rejected') return 'text-red-500';
                  return 'text-gray-500';
                };

                const getPlanName = (planId: number) => {
                  return investmentPlans?.find(plan => plan.id === planId)?.name || `Plan ${planId}`;
                };

                return (
                  <Card key={`tx-${transaction.id}`} className="dark-card dark-border p-4 hover:bg-muted/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type, transaction.status)}
                        <div>
                          <p className="font-medium dark-text capitalize">
                            {transaction.type === 'investment' && transaction.planId 
                              ? `Investment - ${getPlanName(transaction.planId)}`
                              : transaction.type
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy • HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold dark-text">
                          {transaction.type === 'withdrawal' ? '-' : '+'}
                          {formatBitcoin(transaction.amount)} BTC
                        </p>
                        <p className={`text-sm capitalize ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </p>
                      </div>
                    </div>

                    {/* Transaction Hash or Address */}
                    {transaction.transactionHash && (
                      <div className="mt-3 pt-3 border-t dark-border">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {transaction.type === 'withdrawal' ? 'To Address' : 'TX Hash'}
                          </span>
                          <span className="font-mono text-xs dark-text">
                            {transaction.transactionHash.length > 16 
                              ? `${transaction.transactionHash.substring(0, 8)}...${transaction.transactionHash.substring(-8)}`
                              : transaction.transactionHash
                            }
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {transaction.notes && (
                      <div className="mt-2 p-2 bg-muted/30 rounded text-sm text-muted-foreground">
                        <strong>Note:</strong> {transaction.notes}
                      </div>
                    )}

                    {/* Confirmation details for wallet-style display */}
                    {transaction.status === 'confirmed' && (
                      <div className="mt-2 pt-2 border-t dark-border space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Confirmations</span>
                          <span className="text-green-500">6/6 ✓</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Network Fee</span>
                          <span>0.00001245 BTC</span>
                        </div>
                        {transaction.confirmedAt && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Confirmed</span>
                            <span>{format(new Date(transaction.confirmedAt), 'MMM dd, HH:mm')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              }) : (
                <Card className="dark-card dark-border">
                  <CardContent className="pt-6 text-center">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No Transaction History</h3>
                    <p className="text-sm text-muted-foreground">Your transactions will appear here once you make deposits or withdrawals.</p>
                  </CardContent>
                </Card>
              )}

              {/* Investment History as Transactions */}
              {Array.isArray(investments) && investments.length > 0 ? investments.map((investment) => {
                const currentValue = parseFloat(investment.amount) + parseFloat(investment.currentProfit);
                const progress = calculateInvestmentProgress(new Date(investment.startDate), new Date(investment.endDate));
                const getPlanName = (planId: number) => {
                  return investmentPlans?.find(plan => plan.id === planId)?.name || `Plan ${planId}`;
                };

                return (
                  <Card key={`inv-${investment.id}`} className="dark-card dark-border p-4 hover:bg-muted/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          investment.isActive ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          {investment.isActive ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <Award className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium dark-text">
                            {getPlanName(investment.planId)} Investment
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(investment.startDate), 'MMM dd, yyyy • HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold dark-text">
                          {formatBitcoin(currentValue.toString())} BTC
                        </p>
                        <p className={`text-sm ${investment.isActive ? 'text-green-500' : 'text-blue-500'}`}>
                          {investment.isActive ? 'Active' : 'Completed'}
                        </p>
                      </div>
                    </div>

                    {/* Investment Details */}
                    <div className="mt-3 pt-3 border-t dark-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Principal</span>
                        <span className="dark-text">{formatBitcoin(investment.amount)} BTC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Profit</span>
                        <span className="text-green-500">+{formatBitcoin(investment.currentProfit)} BTC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">End Date</span>
                        <span className="dark-text">{format(new Date(investment.endDate), 'MMM dd, yyyy')}</span>
                      </div>

                      {/* Progress bar for active investments */}
                      {investment.isActive && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5">
                            <div 
                              className="bg-bitcoin h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              }) : (
                <Card className="dark-card dark-border">
                  <CardContent className="pt-6 text-center">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No Investment History</h3>
                    <p className="text-sm text-muted-foreground">Your investments will appear here once you start investing.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Bitcoin Transactions from Notifications */}
            {Array.isArray(notifications) && notifications
              .filter(notif => notif.title.includes("Bitcoin Received") || notif.title.includes("Bitcoin Sent"))
              .length > 0 ? notifications
              .filter(notif => notif.title.includes("Bitcoin Received") || notif.title.includes("Bitcoin Sent"))
              .map((notification) => {
                const isReceived = notification.title.includes("Bitcoin Received");
                const message = notification.message;

                // Extract Bitcoin amount from message
                const amountMatch = message.match(/(\d+\.?\d*) BTC/);
                const amount = amountMatch ? amountMatch[1] : "0";

                // Extract transaction ID
                const txMatch = message.match(/Transaction ID: ([a-zA-Z0-9]+)/);
                const txId = txMatch ? txMatch[1] : "";

                const currencyPrice = currency === 'USD' ? bitcoinPrice?.usd.price : bitcoinPrice?.gbp.price;
                const fiatValue = currencyPrice ? parseFloat(amount) * currencyPrice : 0;

                return (
                  <Card key={`notif-${notification.id}`} className="dark-card dark-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isReceived ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-500" />
                          )}
                          <CardTitle className="text-lg dark-text">
                            {isReceived ? "Bitcoin Received" : "Bitcoin Sent"}
                          </CardTitle>
                        </div>
                        <Badge variant={isReceived ? "default" : "secondary"}>
                          {isReceived ? "Received" : "Sent"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Amount</span>
                          <div className="text-right">
                            <div className={`font-semibold ${isReceived ? "text-green-500" : "text-red-500"}`}>
                              {isReceived ? "+" : "-"}{formatBitcoin(amount)} BTC
                            </div>
                            {currencyPrice && (
                              <div className="text-sm text-muted-foreground">
                                {isReceived ? "+" : "-"}{formatCurrency(fiatValue, currency)}
                              </div>
                            )}
                          </div>
                        </div>

                        {txId && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Transaction ID</span>
                            <span className="text-sm dark-text font-mono">{txId}...</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Date</span>
                          <span className="text-sm dark-text">{formatDate(new Date(notification.createdAt))}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="default" className="text-xs">Confirmed</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <Card className="dark-card dark-border">
                  <CardContent className="pt-6 text-center">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No Bitcoin Activity</h3>
                    <p className="text-sm text-muted-foreground">Your Bitcoin transactions will appear here.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Show empty state only if no transactions, investments, or notifications */}
            {(!Array.isArray(investments) || investments.length === 0) && 
             (!Array.isArray(transactions) || transactions.length === 0) &&
             (!Array.isArray(notifications) || notifications.filter(n => n.title.includes("Bitcoin")).length === 0) && (
              <Card className="dark-card dark-border">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold dark-text mb-2">No Transaction History</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't made any transactions or investments yet. Start investing or receive Bitcoin to see your history here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
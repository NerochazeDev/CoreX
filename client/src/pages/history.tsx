
import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useCurrency } from "@/hooks/use-currency";
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
  const { user, isLoading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [hasAttemptedAuth, setHasAttemptedAuth] = React.useState(false);

  // Track when auth check is complete
  React.useEffect(() => {
    if (!authLoading) {
      setHasAttemptedAuth(true);
    }
  }, [authLoading]);

  // Show loading state while checking authentication
  if (authLoading || !hasAttemptedAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only redirect after auth check is definitely complete
  if (!user && hasAttemptedAuth) {
    setLocation('/login');
    return null;
  }

  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/investments/user/${user.id}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`
        }
      });
      if (!response.ok) {
        console.error('Failed to fetch investments:', response.status);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
  });

  const { data: notifications, isLoading: loadingNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/${user?.id}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`
        }
      });
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
      if (!user?.id) return [];
      const response = await fetch(`/api/transactions`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`
        }
      });
      if (!response.ok) {
        console.error('Failed to fetch transactions:', response.status);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
  });

  // Fetch deposit sessions for user
  const { data: depositSessions } = useQuery<any[]>({
    queryKey: ['/api/deposit-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/deposit/sessions`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`
        }
      });
      if (!response.ok) return [];
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header with Gradient */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Transaction History
                </h1>
                <p className="text-sm text-white/90 font-medium">Complete record of your activities</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {isLoading || loadingNotifications || loadingTransactions ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="relative">
                <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-1/4" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recent transactions from API */}
            {Array.isArray(transactions) && transactions.map((transaction) => {
              const getTransactionIcon = (type: string, status: string) => {
                if (type === 'deposit') return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
                if (type === 'withdrawal') return <ArrowUpRight className="w-5 h-5 text-red-500" />;
                if (type === 'investment') return <TrendingUp className="w-5 h-5 text-blue-500" />;
                return <Activity className="w-5 h-5 text-gray-500" />;
              };

              const getStatusColor = (status: string) => {
                if (status === 'confirmed') return 'text-green-500';
                if (status === 'pending') return 'text-yellow-500';
                if (status === 'rejected') return 'text-red-500';
                return 'text-gray-500';
              };

              const getPlanName = (planId: number) => {
                return investmentPlans?.find((plan: any) => plan.id === planId)?.name || `Plan ${planId}`;
              };

              return (
                <div key={`tx-${transaction.id}`} className="relative">
                  <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                  <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20 hover:shadow-2xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                            {getTransactionIcon(transaction.type, transaction.status)}
                          </div>
                          <div>
                            <p className="font-bold text-orange-800 dark:text-orange-100 capitalize text-lg">
                              {transaction.type === 'investment' && transaction.planId 
                                ? `Investment - ${getPlanName(transaction.planId)}`
                                : transaction.type
                              }
                            </p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              {format(new Date(transaction.createdAt), 'MMM dd, yyyy • HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-800 dark:text-orange-100 text-xl">
                            {transaction.type === 'withdrawal' ? '-' : '+'}
                            {formatBitcoin(transaction.amount)} BTC
                          </p>
                          {bitcoinPrice && (
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              ≈ {transaction.type === 'withdrawal' ? '-' : '+'}
                              {formatCurrency(
                                parseFloat(transaction.amount) * (
                                  currency === 'USD' ? bitcoinPrice.usd.price : 
                                  currency === 'GBP' ? bitcoinPrice.gbp.price : 
                                  bitcoinPrice.eur.price
                                ), 
                                currency
                              )}
                            </p>
                          )}
                          <Badge className={`mt-2 ${getStatusColor(transaction.status)} bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700/50`}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Transaction Hash or Address */}
                      {transaction.transactionHash && (
                        <div className="mt-4 pt-4 border-t border-orange-400/20 dark:border-orange-500/30">
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600 dark:text-orange-400">
                              {transaction.type === 'withdrawal' ? 'To Address' : 'TX Hash'}
                            </span>
                            <span className="font-mono text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
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
                        <div className="mt-3 p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl text-sm text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-700/50">
                          <strong>Note:</strong> {transaction.notes}
                        </div>
                      )}

                      {/* Confirmation details for wallet-style display */}
                      {transaction.status === 'confirmed' && (
                        <div className="mt-3 pt-3 border-t border-orange-400/20 dark:border-orange-500/30 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600 dark:text-orange-400">Confirmations</span>
                            <span className="text-green-500 font-medium">6/6 ✓</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600 dark:text-orange-400">Network Fee</span>
                            <span className="text-orange-700 dark:text-orange-300">0.00001245 BTC</span>
                          </div>
                          {transaction.confirmedAt && (
                            <div className="flex justify-between text-sm">
                              <span className="text-orange-600 dark:text-orange-400">Confirmed</span>
                              <span className="text-orange-700 dark:text-orange-300">{format(new Date(transaction.confirmedAt), 'MMM dd, HH:mm')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {/* Investment History as Transactions */}
            {Array.isArray(investments) && investments.map((investment) => {
              const currentValue = parseFloat(investment.amount) + parseFloat(investment.currentProfit);
              const progress = calculateInvestmentProgress(new Date(investment.startDate), new Date(investment.endDate));
              const getPlanName = (planId: number) => {
                return investmentPlans?.find((plan: any) => plan.id === planId)?.name || `Plan ${planId}`;
              };

              return (
                <div key={`inv-${investment.id}`} className="relative">
                  <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                  <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20 hover:shadow-2xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                            investment.isActive ? 
                            'bg-gradient-to-br from-green-400/30 to-green-500/40 shadow-green-500/30' : 
                            'bg-gradient-to-br from-blue-400/30 to-blue-500/40 shadow-blue-500/30'
                          }`}>
                            {investment.isActive ? (
                              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            ) : (
                              <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-orange-800 dark:text-orange-100 text-lg">
                              {getPlanName(investment.planId)} Investment
                            </p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              {format(new Date(investment.startDate), 'MMM dd, yyyy • HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-800 dark:text-orange-100 text-xl">
                            {formatBitcoin(currentValue.toString())} BTC
                          </p>
                          {bitcoinPrice && (
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              ≈ {formatCurrency(
                                currentValue * (
                                  currency === 'USD' ? bitcoinPrice.usd.price : 
                                  currency === 'GBP' ? bitcoinPrice.gbp.price : 
                                  bitcoinPrice.eur.price
                                ), 
                                currency
                              )}
                            </p>
                          )}
                          <Badge className={`mt-2 ${investment.isActive ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50'}`}>
                            {investment.isActive ? 'Active' : 'Completed'}
                          </Badge>
                        </div>
                      </div>

                      {/* Investment Details */}
                      <div className="mt-4 pt-4 border-t border-orange-400/20 dark:border-orange-500/30 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-600 dark:text-orange-400">Principal</span>
                          <span className="text-orange-700 dark:text-orange-300 font-medium">{formatBitcoin(investment.amount)} BTC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-600 dark:text-orange-400">Current Profit</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">+{formatBitcoin(investment.currentProfit)} BTC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-600 dark:text-orange-400">End Date</span>
                          <span className="text-orange-700 dark:text-orange-300 font-medium">{format(new Date(investment.endDate), 'MMM dd, yyyy')}</span>
                        </div>

                        {/* Progress bar for active investments */}
                        {investment.isActive && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-orange-600 dark:text-orange-400">Progress</span>
                              <span className="text-orange-700 dark:text-orange-300 font-medium">{progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-orange-100 dark:bg-orange-900/30 rounded-full h-2 border border-orange-200/50 dark:border-orange-700/50">
                              <div 
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300 shadow-sm shadow-orange-500/30" 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {/* Deposit Sessions */}
            {Array.isArray(depositSessions) && depositSessions.map((session) => {
              const isCompleted = session.status === 'completed';
              const isPending = session.status === 'pending';
              const isExpired = session.status === 'expired';
              
              return (
                <div key={`session-${session.sessionToken}`} className="relative">
                  <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                  <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20 hover:shadow-2xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                            isCompleted ? 'bg-gradient-to-br from-green-400/30 to-green-500/40 shadow-green-500/30' :
                            isPending ? 'bg-gradient-to-br from-yellow-400/30 to-yellow-500/40 shadow-yellow-500/30' :
                            'bg-gradient-to-br from-red-400/30 to-red-500/40 shadow-red-500/30'
                          }`}>
                            <ArrowDownLeft className={`w-6 h-6 ${
                              isCompleted ? 'text-green-600 dark:text-green-400' :
                              isPending ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-bold text-orange-800 dark:text-orange-100 text-lg">
                              TRC20 USDT Deposit
                            </p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              {format(new Date(session.createdAt), 'MMM dd, yyyy • HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-800 dark:text-orange-100 text-xl">
                            ${session.amountReceived || session.amount} USDT
                          </p>
                          <Badge className={`mt-2 ${
                            isCompleted ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50' :
                            isPending ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50' :
                            'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50'
                          }`}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-orange-400/20 dark:border-orange-500/30 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-600 dark:text-orange-400">Deposit Address</span>
                          <span className="font-mono text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                            {session.depositAddress.substring(0, 10)}...{session.depositAddress.slice(-8)}
                          </span>
                        </div>
                        
                        {session.blockchainTxHash && (
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600 dark:text-orange-400">Blockchain TX</span>
                            <span className="font-mono text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                              {session.blockchainTxHash.substring(0, 10)}...{session.blockchainTxHash.slice(-8)}
                            </span>
                          </div>
                        )}

                        {session.confirmations !== undefined && session.confirmations > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600 dark:text-orange-400">Confirmations</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {session.confirmations}/6 {session.confirmations >= 6 ? '✓' : '⏳'}
                            </span>
                          </div>
                        )}

                        {session.completedAt && (
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600 dark:text-orange-400">Completed</span>
                            <span className="text-orange-700 dark:text-orange-300 font-medium">
                              {format(new Date(session.completedAt), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {/* Bitcoin Transactions from Notifications */}
            {Array.isArray(notifications) && notifications
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
                  <div key={`notif-${notification.id}`} className="relative">
                    <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                    <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                              isReceived ? 
                              'bg-gradient-to-br from-green-400/30 to-green-500/40 shadow-green-500/30' : 
                              'bg-gradient-to-br from-red-400/30 to-red-500/40 shadow-red-500/30'
                            }`}>
                              {isReceived ? (
                                <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <CardTitle className="text-lg text-orange-800 dark:text-orange-100">
                              {isReceived ? "Bitcoin Received" : "Bitcoin Sent"}
                            </CardTitle>
                          </div>
                          <Badge variant={isReceived ? "default" : "secondary"} className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50">
                            {isReceived ? "Received" : "Sent"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-orange-600 dark:text-orange-400">Amount</span>
                            <div className="text-right">
                              <div className={`font-bold text-lg ${isReceived ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                {isReceived ? "+" : "-"}{formatBitcoin(amount)} BTC
                              </div>
                              {currencyPrice && (
                                <div className="text-sm text-orange-600 dark:text-orange-400">
                                  ≈ {isReceived ? "+" : "-"}{formatCurrency(fiatValue, currency)}
                                </div>
                              )}
                            </div>
                          </div>

                          {txId && (
                            <div className="flex justify-between items-center">
                              <span className="text-orange-600 dark:text-orange-400">Transaction ID</span>
                              <span className="text-sm text-orange-700 dark:text-orange-300 font-mono bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">{txId}...</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-orange-600 dark:text-orange-400">Date</span>
                            <span className="text-sm text-orange-700 dark:text-orange-300">{formatDate(new Date(notification.createdAt))}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-orange-600 dark:text-orange-400">Status</span>
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50">Confirmed</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}

            {/* Show empty state only if no transactions, investments, deposit sessions, or notifications */}
            {(!Array.isArray(investments) || investments.length === 0) && 
             (!Array.isArray(transactions) || transactions.length === 0) &&
             (!Array.isArray(depositSessions) || depositSessions.length === 0) &&
             (!Array.isArray(notifications) || notifications.filter(n => n.title.includes("Bitcoin")).length === 0) && (
              <div className="relative max-w-md mx-auto">
                <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20 backdrop-blur-xl">
                  <CardContent className="p-8 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25">
                        <Activity className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-orange-800 dark:text-orange-100">No Transaction History</h3>
                      <p className="text-orange-600 dark:text-orange-300">
                        You haven't made any transactions or investments yet. Start investing or receive Bitcoin to see your history here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}

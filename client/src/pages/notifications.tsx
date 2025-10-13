import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Bell, CheckCheck, Filter, Search, Trash2, Bitcoin, TrendingUp, AlertTriangle, Info, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Notification, Transaction } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils";

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const [filter, setFilter] = useState<'all' | 'unread' | 'success' | 'error' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => fetch(`/api/notifications/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user?.id,
  });

  // Fetch unread notification count separately for real-time updates
  const { data: unreadNotificationCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user?.id, 'unread-count'],
    queryFn: () => fetch(`/api/notifications/${user?.id}/unread-count`).then(res => res.json()),
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh unread count more frequently
  });


  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/${user?.id}/mark-all-read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "All notifications marked as read",
        description: "Your notification center is now up to date.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id, 'unread-count'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id, 'unread-count'] });
    },
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/${user?.id}/clear-all`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear all notifications');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "All notifications cleared",
        description: "Your notification center is now empty.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
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
    setLocation('/login');
    return null;
  }

  // Filter and search notifications
  const filteredNotifications = notifications?.filter(notification => {
    // Apply filter
    if (filter === 'unread' && notification.isRead) return false;
    if (filter !== 'all' && filter !== 'unread' && notification.type !== filter) return false;

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return notification.title.toLowerCase().includes(searchLower) || 
             notification.message.toLowerCase().includes(searchLower);
    }

    return true;
  }) || [];

  // Use unread count from dedicated query
  const unreadCount = unreadNotificationCount?.count || notifications?.filter(n => !n.isRead).length || 0;

  // Helper function to extract transaction ID from notification and check if it's pending
  const getRelatedPendingTransaction = (notification: Notification) => {
    if (!transactions) return null;

    // Only show cancel button for specific pending transaction notifications
    const isPendingTransactionNotification = (
      notification.title.includes("Investment Submitted") || 
      notification.title.includes("Deposit Submitted") ||
      notification.title.includes("Transaction Pending")
    ) && notification.type === 'info';

    if (isPendingTransactionNotification) {
      // Look for pending transactions that match the timeframe of this notification
      const pendingTransactions = transactions.filter(t => t.status === 'pending');
      if (pendingTransactions.length > 0) {
        // Find transaction created around the same time as the notification (within 1 minute)
        const notificationTime = new Date(notification.createdAt).getTime();
        const matchingTransaction = pendingTransactions.find(t => {
          const transactionTime = new Date(t.createdAt).getTime();
          return Math.abs(notificationTime - transactionTime) < 60000; // Within 1 minute
        });
        return matchingTransaction || null;
      }
    }
    return null;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      case 'warning':
        return 'border-orange-500/20 bg-orange-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header with Gradient */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/')}
                className="h-10 w-10 p-0 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-md transition-all duration-200"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className="bg-white text-orange-600 text-xs font-bold">
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-white/90 font-medium">
                  {notifications?.length || 0} total notifications • {unreadCount} unread
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700/50 dark:text-orange-300 dark:hover:bg-orange-900/20 sm:min-w-0 min-w-[80px]"
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Mark All Read</span>
                  <span className="sm:hidden">Read</span>
                </Button>
              )}
              {notifications && notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearAllNotificationsMutation.mutate()}
                  disabled={clearAllNotificationsMutation.isPending}
                  className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700/50 dark:text-orange-300 dark:hover:bg-orange-900/20 sm:min-w-0 min-w-[80px]"
                  data-testid="button-clear-all"
                >
                  <Trash2 className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Clear All</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-6">
        {/* Search and Filter */}
        <div className="relative">
          <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
          <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-600 dark:text-orange-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 dark:border-orange-700/50 focus:border-orange-400 dark:focus:border-orange-500 bg-white/50 dark:bg-gray-900/50"
                  data-testid="input-search-notifications"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { key: 'all', label: 'All', count: notifications?.length || 0 },
                  { key: 'unread', label: 'Unread', count: unreadCount },
                  { key: 'success', label: 'Success', count: notifications?.filter(n => n.type === 'success').length || 0 },
                  { key: 'error', label: 'Errors', count: notifications?.filter(n => n.type === 'error').length || 0 },
                  { key: 'info', label: 'Info', count: notifications?.filter(n => n.type === 'info').length || 0 },
                ].map(({ key, label, count }) => (
                  <Button
                    key={key}
                    variant={filter === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(key as any)}
                    className={`whitespace-nowrap ${
                      filter === key 
                        ? "bg-orange-500 text-white hover:bg-orange-600 border-orange-500" 
                        : "border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700/50 dark:text-orange-300 dark:hover:bg-orange-900/20"
                    }`}
                    data-testid={`filter-${key}`}
                  >
                    {label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="relative">
                <div className="absolute top-1 left-1 w-full h-full bg-gradient-to-br from-orange-500/10 to-orange-600/15 rounded-xl blur-sm"></div>
                <Card className="relative bg-gradient-to-br from-orange-500/5 via-orange-600/3 to-orange-700/5 dark:from-orange-600/10 dark:via-orange-700/8 dark:to-orange-800/10 backdrop-blur-xl border border-orange-400/20 dark:border-orange-500/20 rounded-2xl shadow-lg shadow-orange-600/10 animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-orange-300/50 dark:bg-orange-600/50 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-orange-300/50 dark:bg-orange-600/50 rounded w-3/4"></div>
                        <div className="h-3 bg-orange-300/30 dark:bg-orange-600/30 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="relative group">
                <div className="absolute top-1 left-1 w-full h-full bg-gradient-to-br from-orange-500/10 to-orange-600/15 rounded-xl blur-sm group-hover:blur-md transition-all duration-200"></div>
                <Card 
                  className={`relative bg-gradient-to-br from-orange-500/5 via-orange-600/3 to-orange-700/5 dark:from-orange-600/10 dark:via-orange-700/8 dark:to-orange-800/10 backdrop-blur-xl border border-orange-400/20 dark:border-orange-500/20 rounded-2xl shadow-lg shadow-orange-600/10 cursor-pointer transition-all hover:shadow-xl hover:shadow-orange-600/20 ${
                    !notification.isRead ? 'ring-2 ring-orange-400/30 dark:ring-orange-500/40' : ''
                  }`}
                  onClick={() => {
                    setLocation(`/notifications/${notification.id}`);
                  }}
                  data-testid={`notification-${notification.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-bitcoin rounded-full"></div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                          {notification.message}
                        </p>
                        {/* Show USD equivalent for Bitcoin amount notifications */}
                        {(notification.title.includes("Bitcoin") || notification.title.includes("Investment") || notification.title.includes("Deposit") || notification.title.includes("Withdrawal")) && bitcoinPrice && (() => {
                          const amountMatch = notification.message.match(/(\d+\.?\d*) BTC/);
                          if (amountMatch) {
                            const amount = parseFloat(amountMatch[1]);
                            const currencyPrice = currency === 'USD' ? bitcoinPrice.usd.price : 
                                                currency === 'GBP' ? bitcoinPrice.gbp.price : 
                                                bitcoinPrice.eur.price;
                            const fiatValue = amount * currencyPrice;
                            return (
                              <p className="text-xs text-bitcoin mt-1">
                                ≈ {formatCurrency(fiatValue, currency)}
                              </p>
                            );
                          }
                          return null;
                        })()}
                        <div className="flex items-center justify-between mt-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs capitalize"
                          >
                            {notification.type}
                          </Badge>
                          {(() => {
                            const pendingTransaction = getRelatedPendingTransaction(notification);
                            return pendingTransaction && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 h-6 px-2 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Transaction</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel this {pendingTransaction.type} of {pendingTransaction.amount} BTC? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Transaction</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelTransactionMutation.mutate(pendingTransaction.id)}
                                      disabled={cancelTransactionMutation.isPending}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {cancelTransactionMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {filter === 'all' 
                ? 'When you start using BitVault Pro, important updates and transaction notifications will appear here.'
                : `No notifications match the "${filter}" filter.`
              }
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {notifications && notifications.length > 0 && (
          <Card className="dark-card dark-border">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-foreground text-sm">Notification Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{notifications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unread</span>
                    <span className="font-medium text-bitcoin">{unreadCount}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success</span>
                    <span className="font-medium text-green-400">
                      {notifications.filter(n => n.type === 'success').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Errors</span>
                    <span className="font-medium text-red-400">
                      {notifications.filter(n => n.type === 'error').length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
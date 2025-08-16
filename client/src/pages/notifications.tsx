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

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    <div className="max-w-2xl mx-auto lg:max-w-4xl bg-background min-h-screen relative lg:ml-64">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b dark-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation('/')}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5 text-bitcoin" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className="bg-bitcoin text-black text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Stay updated with your account • {notifications?.length || 0}/50 notifications
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark All Read
                </Button>
              )}
              {notifications && notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearAllNotificationsMutation.mutate()}
                  disabled={clearAllNotificationsMutation.isPending}
                  className="text-xs"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-4">
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
                className="whitespace-nowrap"
              >
                {label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </Button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="dark-card dark-border animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`dark-card dark-border cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'ring-2 ring-bitcoin/20' : ''
                } ${getNotificationColor(notification.type)}`}
                onClick={() => {
                  setLocation(`/notifications/${notification.id}`);
                }}
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
      </div>

      <BottomNavigation />
    </div>
  );
}
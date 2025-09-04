import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@shared/schema';
import { cn } from '@/lib/utils';

export function NotificationsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => fetch(`/api/notifications/${user?.id}`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }),
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user?.id, 'unread-count'],
    queryFn: () => fetch(`/api/notifications/${user?.id}/unread-count`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    }),
    enabled: !!user?.id,
    refetchInterval: 3000, // Refresh every 3 seconds for instant updates
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const markAsReadMutation = useMutation({
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

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/${user?.id}/clear-all`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear all notifications');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id, 'unread-count'] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  if (!user) return null;

  return (
    <Card className="dark-card dark-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark-text">
          <Bell className="w-5 h-5" />
          Notifications
          {unreadCount && unreadCount.count > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {unreadCount.count}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading notifications...</div>
        ) : notifications && notifications.length > 0 ? (
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border dark-border rounded-lg ${
                    !notification.isRead ? 'bg-muted/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium dark-text text-sm">{notification.title}</h4>
                        <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs">
                          {notification.type}
                        </Badge>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 whitespace-pre-line">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(new Date(notification.createdAt))}
                        </span>
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                            className="h-6 px-2 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

function getTypeBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case 'success':
      return 'default';
    case 'error':
      return 'destructive';
    case 'warning':
      return 'secondary';
    default:
      return 'outline';
  }
}
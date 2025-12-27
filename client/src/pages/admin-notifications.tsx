import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Bell, Send, User, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType, Notification } from "@shared/schema";

export default function ManagementNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("info");

  // Require proper admin authentication

  const { data: users = [], isLoading: loadingUsers } = useQuery<UserType[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user?.isAdmin,
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: { userId: number; title: string; message: string; type: string }) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification Sent",
        description: "The notification has been sent successfully",
      });
      setTitle("");
      setMessage("");
      setSelectedUserId("");
      setType("info");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const handleSendNotification = () => {
    console.log("Send notification clicked", { selectedUserId, title, message, type });
    
    if (!selectedUserId || !title || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      userId: parseInt(selectedUserId),
      title,
      message,
      type,
    });
  };

  if (!user?.isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  const getTypeIcon = (notificationType: string) => {
    switch (notificationType) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen dark-bg">
      <div className="max-w-sm mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark-text mb-2">Send Notifications</h1>
          <p className="text-muted-foreground">Send individual notifications to users</p>
        </div>

        <div className="space-y-6">
          {/* Send Notification Form */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <Send className="w-5 h-5" />
                Send New Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="user-select">Select User</Label>
                <Select value={selectedUserId} onValueChange={(value) => {
                  console.log("User selected:", value);
                  setSelectedUserId(value);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.email} {u.isAdmin && "(Admin)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUserId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {users?.find(u => u.id.toString() === selectedUserId)?.email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="type-select">Notification Type</Label>
                <Select value={type} onValueChange={(value: "info" | "success" | "warning" | "error") => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        Information
                      </div>
                    </SelectItem>
                    <SelectItem value="success">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Success
                      </div>
                    </SelectItem>
                    <SelectItem value="warning">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Warning
                      </div>
                    </SelectItem>
                    <SelectItem value="error">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Error
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Notification message"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSendNotification}
                disabled={sendNotificationMutation.isPending || !selectedUserId || !title || !message}
                className="w-full"
              >
                {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
              </Button>
            </CardContent>
          </Card>

          {/* User List */}
          <Card className="dark-card dark-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark-text">
                <User className="w-5 h-5" />
                Registered Users - Click to Select
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div>Loading users...</div>
              ) : users && users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div 
                      key={u.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUserId === u.id.toString() 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'dark-border hover:border-blue-300'
                      }`}
                      onClick={() => {
                        console.log("User clicked:", u.id, u.email);
                        setSelectedUserId(u.id.toString());
                      }}
                    >
                      <div>
                        <div className="font-medium dark-text">{u.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Balance: {parseFloat(u.balance).toFixed(8)} BTC
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bitcoin Address: {u.bitcoinAddress ? `${u.bitcoinAddress.substring(0, 20)}...` : 'No wallet'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.isAdmin && <Badge variant="secondary">Admin</Badge>}
                        {selectedUserId === u.id.toString() && (
                          <Badge variant="default" className="bg-blue-600">Selected</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">No users found</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
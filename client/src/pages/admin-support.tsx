import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/protected-route";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  ArrowLeft,
  User,
  Calendar,
  Priority
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SupportMessage {
  id: number;
  userId: number;
  subject: string;
  message: string;
  imageUrl?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  adminResponse?: string;
  respondedBy?: number;
  createdAt: string;
  respondedAt?: string;
  resolvedAt?: string;
  userEmail?: string;
}

function AdminSupportContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [responseText, setResponseText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Fetch support messages
  const { data: messages, isLoading, refetch } = useQuery<SupportMessage[]>({
    queryKey: ['/api/admin/support/messages'],
    enabled: !!user?.isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Respond to message mutation
  const respondMutation = useMutation({
    mutationFn: async ({ messageId, response, newStatus }: { messageId: number, response: string, newStatus: string }) => {
      return await apiRequest('POST', `/api/admin/support/messages/${messageId}/respond`, {
        adminResponse: response,
        status: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/messages'] });
      setSelectedMessage(null);
      setResponseText("");
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the user.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send response.",
        variant: "destructive",
      });
    },
  });

  // Update message status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ messageId, status }: { messageId: number, status: string }) => {
      return await apiRequest('PATCH', `/api/admin/support/messages/${messageId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/messages'] });
      toast({
        title: "Status Updated",
        description: "Message status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
          <Link href="/">
            <Button className="mt-4">Return Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'normal': return 'text-blue-600 dark:text-blue-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'urgent': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredMessages = messages?.filter(message => {
    const statusMatch = statusFilter === 'all' || message.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || message.priority === priorityFilter;
    return statusMatch && priorityMatch;
  }) || [];

  const handleSendResponse = () => {
    if (!selectedMessage || !responseText.trim()) return;
    
    const newStatus = selectedMessage.status === 'open' ? 'in_progress' : selectedMessage.status;
    respondMutation.mutate({
      messageId: selectedMessage.id,
      response: responseText,
      newStatus
    });
  };

  const handleStatusUpdate = (messageId: number, status: string) => {
    updateStatusMutation.mutate({ messageId, status });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-orange-200/50 dark:border-orange-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Support Messages
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage user support requests</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <div className="space-y-4">
          {isLoading && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                <p className="text-gray-600 dark:text-gray-400">Loading support messages...</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && filteredMessages.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No support messages found.</p>
              </CardContent>
            </Card>
          )}

          {filteredMessages.map((message) => (
            <Card key={message.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(message.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {message.subject}
                      </h3>
                      <Badge className={`${getStatusColor(message.status)} text-xs`}>
                        {message.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        User #{message.userId}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                      {message.message}
                    </p>

                    {message.imageUrl && (
                      <div className="mb-4">
                        <img 
                          src={message.imageUrl} 
                          alt="Support attachment" 
                          className="max-w-xs rounded-lg shadow-sm"
                        />
                      </div>
                    )}

                    {message.adminResponse && (
                      <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 mb-4">
                        <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">Admin Response:</h4>
                        <p className="text-green-700 dark:text-green-300 text-sm">
                          {message.adminResponse}
                        </p>
                        {message.respondedAt && (
                          <p className="text-green-600 dark:text-green-400 text-xs mt-2">
                            Responded on {new Date(message.respondedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedMessage(message)}
                            className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Respond
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Respond to Support Message</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{message.subject}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{message.message}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                Your Response
                              </label>
                              <Textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Type your response here..."
                                className="min-h-32"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                onClick={handleSendResponse}
                                disabled={!responseText.trim() || respondMutation.isPending}
                                className="flex-1 bg-orange-500 hover:bg-orange-600"
                              >
                                {respondMutation.isPending ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                Send Response
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {message.status !== 'closed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(message.id, 'in_progress')}
                            disabled={message.status === 'in_progress' || updateStatusMutation.isPending}
                            className="text-yellow-600 border-yellow-200"
                          >
                            Mark In Progress
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(message.id, 'resolved')}
                            disabled={message.status === 'resolved' || updateStatusMutation.isPending}
                            className="text-green-600 border-green-200"
                          >
                            Mark Resolved
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminSupport() {
  return (
    <ProtectedRoute>
      <AdminSupportContent />
    </ProtectedRoute>
  );
}
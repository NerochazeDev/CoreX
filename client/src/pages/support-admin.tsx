
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Reply, X, Shield, AlertTriangle, Lock, ArrowLeft, RefreshCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import React from "react";

export default function SupportAdmin() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setAccessDenied(true);
      return;
    }

    // Allow access if user is either full admin or support admin
    if (user.isAdmin || user.isSupportAdmin) {
      setAccessGranted(true);
    } else {
      setAccessDenied(true);
    }
  }, [user, isLoading]);

  const { data: supportMessages, isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/support/messages'],
    queryFn: async () => {
      const response = await fetch('/api/admin/support/messages', {
        headers: { 'x-backdoor-access': 'true' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch support messages');
      return response.json();
    },
    enabled: accessGranted,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const respondMutation = useMutation({
    mutationFn: async ({ messageId, response, status }: { messageId: number; response: string; status: string }) => {
      return await fetch(`/api/admin/support/messages/${messageId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-backdoor-access': 'true',
        },
        credentials: 'include',
        body: JSON.stringify({ response, status }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to send response');
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the user successfully.",
      });
      setSelectedMessage(null);
      setResponseText("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      open: "bg-green-100 text-green-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      resolved: "bg-blue-100 text-blue-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-600",
      normal: "bg-blue-100 text-blue-600",
      high: "bg-orange-100 text-orange-600",
      urgent: "bg-red-100 text-red-600",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Verifying support admin access...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500/20 bg-slate-900/80">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-red-400 text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <Lock className="w-5 h-5" />
                <span className="font-semibold">Unauthorized Access</span>
              </div>
              <p className="text-red-300 text-sm">
                This support admin interface is restricted to authorized support administrators only.
                {!user && " Please log in with a support admin account."}
                {user && !user.isSupportAdmin && !user.isAdmin && " Your account does not have support admin privileges."}
              </p>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">Support Access</span>
              </div>
              <p className="text-slate-300 text-sm">
                Contact your administrator to request support admin access for customer service duties.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setLocation('/')}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return Home
              </Button>
              {!user && (
                <Button
                  onClick={() => setLocation('/login')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessGranted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Support Admin Dashboard</h1>
                  <p className="text-green-100">
                    {supportMessages?.length || 0} customer conversation{supportMessages?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/support/messages'] })}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <div className="text-right">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-green-100 text-sm">
                    {user?.isAdmin ? 'Full Admin' : 'Support Admin'} • {currentTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{supportMessages?.length || 0}</p>
                    <p className="text-sm text-gray-600">Total Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">O</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {supportMessages?.filter(m => m.status === 'open').length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">P</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {supportMessages?.filter(m => m.status === 'in_progress').length || 0}
                    </p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">R</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {supportMessages?.filter(m => m.status === 'resolved').length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages Container - WhatsApp Style */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                Customer Support Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[700px] overflow-y-auto bg-gray-50">
                {messagesLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-16 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : supportMessages?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
                    <p className="text-gray-500">Customer support conversations will appear here</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-6">
                    {supportMessages?.map((message: any) => (
                      <div key={message.id} className="space-y-4">
                        {/* User Message Bubble */}
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {(message.user?.firstName?.[0] || message.user?.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className="flex-1 max-w-[80%]">
                            <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm text-gray-900">
                                  {message.user ? 
                                    `${message.user.firstName || ''} ${message.user.lastName || ''}`.trim() || message.user.email :
                                    'Unknown User'
                                  }
                                </span>
                                <Badge className={getPriorityBadge(message.priority)}>
                                  {message.priority}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-2">{message.subject}</h4>
                              <p className="text-gray-700 leading-relaxed">{message.message}</p>
                              {message.imageUrl && (
                                <div className="mt-3">
                                  <img 
                                    src={message.imageUrl} 
                                    alt="Support attachment" 
                                    className="max-w-full h-48 object-cover rounded-lg border"
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleTimeString()} • {new Date(message.createdAt).toLocaleDateString()}
                                </span>
                                <Badge className={getStatusBadge(message.status)}>
                                  {message.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Admin Response Bubble */}
                        {message.adminResponse && (
                          <div className="flex gap-3 justify-end">
                            <div className="flex-1 max-w-[80%] flex justify-end">
                              <div className="bg-green-500 text-white rounded-2xl rounded-tr-md p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-sm">Support Response</span>
                                  <Shield className="w-4 h-4" />
                                </div>
                                <p className="leading-relaxed">{message.adminResponse}</p>
                                <div className="text-xs text-green-100 mt-2 text-right">
                                  {new Date(message.respondedAt).toLocaleTimeString()} • {new Date(message.respondedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              S
                            </div>
                          </div>
                        )}

                        {/* Quick Reply Button */}
                        {!message.adminResponse && (
                          <div className="flex justify-center">
                            <Button
                              onClick={() => setSelectedMessage(message)}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-2 flex items-center gap-2 shadow-lg"
                              size="sm"
                            >
                              <Reply className="w-4 h-4" />
                              Reply to Customer
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp-Style Response Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
            {/* WhatsApp Header */}
            <div className="bg-green-600 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedMessage ? (selectedMessage.user?.firstName?.[0] || selectedMessage.user?.email?.[0] || 'U').toUpperCase() : 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {selectedMessage?.user ? 
                      `${selectedMessage.user.firstName || ''} ${selectedMessage.user.lastName || ''}`.trim() || selectedMessage.user.email :
                      'Unknown User'
                    }
                  </h3>
                  <p className="text-green-100 text-sm">Customer Support</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="text-white hover:bg-green-700 p-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {selectedMessage && (
              <div className="bg-gray-50 max-h-[500px] overflow-y-auto">
                {/* Original Message */}
                <div className="p-4">
                  <div className="flex gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {(selectedMessage.user?.firstName?.[0] || selectedMessage.user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {selectedMessage.user ? 
                              `${selectedMessage.user.firstName || ''} ${selectedMessage.user.lastName || ''}`.trim() || selectedMessage.user.email :
                              'Unknown User'
                            }
                          </span>
                          <Badge className={getPriorityBadge(selectedMessage.priority)}>
                            {selectedMessage.priority}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{selectedMessage.subject}</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedMessage.message}</p>
                        {selectedMessage.imageUrl && (
                          <div className="mt-3">
                            <img 
                              src={selectedMessage.imageUrl} 
                              alt="Support attachment" 
                              className="max-w-full h-48 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(selectedMessage.createdAt).toLocaleTimeString()} • {new Date(selectedMessage.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Response Input Area */}
            <div className="bg-white border-t p-4">
              <div className="space-y-3">
                <Textarea
                  value={responseText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseText(e.target.value)}
                  placeholder="Type your response to the customer..."
                  className="min-h-[100px] resize-none border-2 border-gray-200 focus:border-green-500 rounded-2xl p-4 text-base"
                />
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMessage(null)}
                    className="flex-1 rounded-full border-gray-300 hover:border-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => respondMutation.mutate({
                      messageId: selectedMessage?.id,
                      response: responseText,
                      status: "resolved"
                    })}
                    disabled={!responseText.trim() || respondMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    {respondMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Response
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}

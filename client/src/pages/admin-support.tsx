import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { MessageCircle, Clock, CheckCircle, AlertTriangle, X, Image, User, Calendar } from "lucide-react";
import type { SupportTicket, SupportResponse } from "@shared/schema";

export default function AdminSupport() {
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch all tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/admin/support-tickets"],
    refetchInterval: 30000,
  });

  // Fetch ticket details
  const { data: ticketDetails } = useQuery({
    queryKey: ["/api/support/ticket", selectedTicket],
    enabled: selectedTicket !== null,
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Ticket status has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/ticket", selectedTicket] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket status",
        variant: "destructive",
      });
    },
  });

  // Add response mutation
  const addResponseMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      const response = await fetch(`/api/support/ticket/${ticketId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the user!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/ticket", selectedTicket] });
      setResponseMessage("");
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
    const statusConfig = {
      open: { color: "destructive", icon: Clock },
      in_progress: { color: "default", icon: AlertTriangle },
      resolved: { color: "secondary", icon: CheckCircle },
      closed: { color: "outline", icon: X }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "outline",
      normal: "secondary", 
      high: "default",
      urgent: "destructive"
    };
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] as any}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      general: "outline",
      technical: "secondary",
      billing: "default",
      complaint: "destructive"
    };
    
    return (
      <Badge variant={colors[category as keyof typeof colors] as any}>
        {category.toUpperCase()}
      </Badge>
    );
  };

  const handleStatusChange = (ticketId: number, status: string) => {
    updateStatusMutation.mutate({ ticketId, status });
  };

  const handleAddResponse = () => {
    if (!selectedTicket || !responseMessage.trim()) return;
    addResponseMutation.mutate({
      ticketId: selectedTicket,
      message: responseMessage
    });
  };

  const filteredTickets = tickets?.filter((ticket: SupportTicket) => {
    if (statusFilter === "all") return true;
    return ticket.status === statusFilter;
  }) || [];

  const getTicketStats = () => {
    if (!tickets) return { open: 0, inProgress: 0, resolved: 0, total: 0 };
    
    return {
      open: tickets.filter((t: SupportTicket) => t.status === "open").length,
      inProgress: tickets.filter((t: SupportTicket) => t.status === "in_progress").length,
      resolved: tickets.filter((t: SupportTicket) => t.status === "resolved").length,
      total: tickets.length
    };
  };

  const stats = getTicketStats();

  if (ticketsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading support tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customer support tickets and provide assistance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket: SupportTicket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => setSelectedTicket(ticket.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">#{ticket.id} - {ticket.subject}</CardTitle>
                      <div className="flex items-center gap-1 text-gray-500">
                        <User className="w-4 h-4" />
                        <span className="text-sm">User ID: {ticket.userId}</span>
                      </div>
                    </div>
                    <CardDescription className="mb-2">
                      {ticket.message.length > 200 
                        ? `${ticket.message.substring(0, 200)}...` 
                        : ticket.message
                      }
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(ticket.category)}
                      {ticket.imageUrl && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Image className="w-4 h-4" />
                          <span className="text-sm">Image attached</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span>Last updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Support Tickets Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {statusFilter === "all" 
                  ? "No support tickets have been created yet." 
                  : `No ${statusFilter.replace('_', ' ')} tickets found.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={selectedTicket !== null} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          {ticketDetails && ticketDetails.ticket && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle>#{ticketDetails.ticket.id} - {ticketDetails.ticket.subject}</DialogTitle>
                    <DialogDescription className="mt-1">
                      User ID: {ticketDetails.ticket.userId} • Created {new Date(ticketDetails.ticket.createdAt).toLocaleDateString()}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {getStatusBadge(ticketDetails.ticket.status)}
                      {getPriorityBadge(ticketDetails.ticket.priority)}
                      {getCategoryBadge(ticketDetails.ticket.category)}
                    </div>
                    <Select
                      value={ticketDetails.ticket.status}
                      onValueChange={(status) => handleStatusChange(ticketDetails.ticket.id, status)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Original Message */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">Customer Message</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(ticketDetails.ticket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{ticketDetails.ticket.message}</p>
                    {ticketDetails.ticket.imageUrl && (
                      <div className="mt-4">
                        <img 
                          src={ticketDetails.ticket.imageUrl} 
                          alt="Ticket attachment" 
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Separator />

                {/* Responses */}
                <div className="space-y-3">
                  {ticketDetails.responses?.map((response: SupportResponse) => (
                    <Card 
                      key={response.id}
                      className={response.isFromAdmin ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={response.isFromAdmin ? "default" : "secondary"}>
                            {response.isFromAdmin ? "Support Team" : "Customer"}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{response.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add Admin Response */}
                {ticketDetails.ticket.status !== "closed" && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label htmlFor="admin-response">Admin Response</Label>
                      <Textarea
                        id="admin-response"
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Type your response to the customer..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAddResponse}
                          disabled={addResponseMutation.isPending || !responseMessage.trim()}
                        >
                          {addResponseMutation.isPending ? "Sending..." : "Send Response"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleAddResponse();
                            handleStatusChange(ticketDetails.ticket.id, "resolved");
                          }}
                          disabled={addResponseMutation.isPending || !responseMessage.trim()}
                        >
                          Send & Mark Resolved
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
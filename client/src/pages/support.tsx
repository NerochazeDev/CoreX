import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { MessageCircle, Upload, Clock, CheckCircle, AlertTriangle, X, Image, Plus } from "lucide-react";
import type { SupportTicket, SupportResponse } from "@shared/schema";

interface CreateTicketForm {
  subject: string;
  message: string;
  category: string;
  priority: string;
  imageFile?: File;
  imageData?: string;
}

export default function Support() {
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [createForm, setCreateForm] = useState<CreateTicketForm>({
    subject: "",
    message: "",
    category: "general",
    priority: "normal"
  });
  const { toast } = useToast();

  // Fetch user tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/support/my-tickets"],
    refetchInterval: 30000, // Refetch every 30 seconds for updates
  });

  // Fetch ticket details
  const { data: ticketDetails } = useQuery({
    queryKey: ["/api/support/ticket", selectedTicket],
    enabled: selectedTicket !== null,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/support/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Support Ticket Created",
        description: "Your support ticket has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support/my-tickets"] });
      setShowCreateTicket(false);
      setCreateForm({
        subject: "",
        message: "",
        category: "general",
        priority: "normal"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create support ticket",
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
        description: "Your message has been sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support/ticket", selectedTicket] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/my-tickets"] });
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCreateForm(prev => ({
          ...prev,
          imageData: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTicket = () => {
    if (!createForm.subject.trim() || !createForm.message.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both subject and message",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate(createForm);
  };

  const handleAddResponse = () => {
    if (!selectedTicket || !responseMessage.trim()) return;
    addResponseMutation.mutate({
      ticketId: selectedTicket,
      message: responseMessage
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: "blue", icon: Clock },
      in_progress: { color: "yellow", icon: AlertTriangle },
      resolved: { color: "green", icon: CheckCircle },
      closed: { color: "gray", icon: X }
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
    const colors = {
      low: "gray",
      normal: "blue", 
      high: "orange",
      urgent: "red"
    };
    
    return (
      <Badge variant={colors[priority as keyof typeof colors] as any}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get help with your Plus500 VIP account and investments
          </p>
        </div>
        <Button
          onClick={() => setShowCreateTicket(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Support Ticket
        </Button>
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {Array.isArray(tickets) && tickets.length > 0 ? (
          tickets.map((ticket: SupportTicket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => setSelectedTicket(ticket.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      {ticket.message.length > 150 
                        ? `${ticket.message.substring(0, 150)}...` 
                        : ticket.message
                      }
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="pt-0 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span>Category: {ticket.category}</span>
                  {ticket.imageUrl && (
                    <div className="flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      Image attached
                    </div>
                  )}
                </div>
                <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Support Tickets
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't created any support tickets yet.
              </p>
              <Button onClick={() => setShowCreateTicket(true)}>
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue or question and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={createForm.subject}
                onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={createForm.category} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing/Payment</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={createForm.priority} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={createForm.message}
                onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Provide detailed information about your issue..."
                rows={5}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="image">Attach Image (optional)</Label>
              <div className="mt-1">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image')?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </Button>
                {createForm.imageData && (
                  <p className="text-sm text-green-600 mt-2">Image uploaded successfully</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket}
              disabled={createTicketMutation.isPending}
            >
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={selectedTicket !== null} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {ticketDetails && ticketDetails.ticket && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle>{ticketDetails.ticket.subject}</DialogTitle>
                    <DialogDescription className="mt-1">
                      Ticket #{ticketDetails.ticket.id} • Created {new Date(ticketDetails.ticket.createdAt).toLocaleDateString()}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(ticketDetails.ticket.status)}
                    {getPriorityBadge(ticketDetails.ticket.priority)}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Original Message */}
                <Card>
                  <CardContent className="pt-4">
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
                            {response.isFromAdmin ? "Support Team" : "You"}
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

                {/* Add Response */}
                {ticketDetails.ticket.status !== "closed" && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label htmlFor="response">Add Response</Label>
                      <Textarea
                        id="response"
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={3}
                      />
                      <Button 
                        onClick={handleAddResponse}
                        disabled={addResponseMutation.isPending || !responseMessage.trim()}
                      >
                        {addResponseMutation.isPending ? "Sending..." : "Send Response"}
                      </Button>
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
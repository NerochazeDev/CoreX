import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Moon,
  Sun,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
  Smartphone,
  Lock,
  CreditCard,
  Palette,
  Send,
  Upload,
  MessageSquare,
  Key,
  Copy,
  RefreshCw,
  Eye,
  AlertTriangle,
  History
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Crown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const supportMessageSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100, "Subject must be less than 100 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  imageUrl: z.string().optional(),
});

const passwordVerificationSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type SupportMessageForm = z.infer<typeof supportMessageSchema>;
type PasswordVerificationForm = z.infer<typeof passwordVerificationSchema>;

function WhatsAppStyleChat({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [hasReceivedAutoReply, setHasReceivedAutoReply] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async (messageText: string) => {
      let imageUrl = "";

      // Handle image upload if there's a file
      if (imageFile) {
        const imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
        imageUrl = imageData;
      }

      return await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          subject: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
          message: messageText,
          priority: "normal",
          imageUrl: imageUrl || undefined,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to send message');
        return res.json();
      });
    },
    onSuccess: () => {
      // Add message to local state immediately for instant UI feedback
      const newMessage = {
        id: Date.now(),
        message: currentMessage,
        imageUrl: imagePreview,
        createdAt: new Date().toISOString(),
        isUser: true,
      };
      setMessages(prev => [...prev, newMessage]);

      setCurrentMessage("");
      setImageFile(null);
      setImagePreview(null);

      toast({
        title: "Message Sent",
        description: "Your message has been sent to our support team!",
      });

      // Add auto-reply after a short delay, but only once
      if (!hasReceivedAutoReply) {
        setTimeout(() => {
          const autoReply = {
            id: Date.now() + 1,
            message: "Thank you for contacting BitVault Pro support! We've received your message and will get back to you within 15-30 minutes. Our team is reviewing your request.",
            createdAt: new Date().toISOString(),
            isUser: false,
          };
          setMessages(prev => [...prev, autoReply]);
          setHasReceivedAutoReply(true);
        }, 2000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (currentMessage.trim() || imageFile) {
      sendMessage.mutate(currentMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] h-[600px] p-0 gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-primary text-primary-foreground">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">BitVault Pro Support</h3>
            <p className="text-xs opacity-90">Online • Responds within minutes</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Welcome to BitVault Pro Support!<br />
                  How can we help you today?
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[280px] rounded-2xl px-4 py-2 ${
                  msg.isUser
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-white dark:bg-gray-700 text-foreground rounded-bl-md shadow-sm'
                }`}>
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Attached"
                      className="rounded-lg mb-2 max-w-full h-auto"
                    />
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 py-2 bg-muted/50 border-t">
            <div className="flex items-center gap-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg"
              />
              <span className="text-sm text-muted-foreground flex-1">Image attached</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeImage}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-background border-t">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="min-h-[44px] max-h-32 resize-none rounded-full px-4 py-3 pr-12 border-2 focus:border-primary"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '44px'
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="absolute right-3 top-3 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
              >
                <Upload className="w-5 h-5" />
              </label>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={(!currentMessage.trim() && !imageFile) || sendMessage.isPending}
              className="h-11 w-11 rounded-full p-0"
              data-testid="button-send-support-message"
            >
              {sendMessage.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { currency, toggleCurrency } = useCurrency();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [notifications, setNotifications] = useState(true);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [currentRecoveryCode, setCurrentRecoveryCode] = useState("");
  const [showViewRecoveryDialog, setShowViewRecoveryDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: "", message: "", priority: "normal" as const });
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportMessagesLoading, setSupportMessagesLoading] = useState(false);

  const viewRecoveryForm = useForm<PasswordVerificationForm>({
    resolver: zodResolver(passwordVerificationSchema),
  });

  const regenerateForm = useForm<PasswordVerificationForm>({
    resolver: zodResolver(passwordVerificationSchema),
  });

  const viewRecoveryMutation = useMutation({
    mutationFn: async (data: PasswordVerificationForm) => {
      const response = await fetch('/api/auth/view-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to view recovery code');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCurrentRecoveryCode(data.recoveryCode);
      setShowRecoveryCode(true);
      setShowViewRecoveryDialog(false);
      viewRecoveryForm.reset();
      toast({
        title: "Recovery Code Retrieved",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to retrieve recovery code",
        variant: "destructive",
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async (data: PasswordVerificationForm) => {
      const response = await fetch('/api/auth/regenerate-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate recovery code');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCurrentRecoveryCode(data.recoveryCode);
      setShowRecoveryCode(true);
      setShowRegenerateDialog(false);
      regenerateForm.reset();
      toast({
        title: "Recovery Code Regenerated",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate recovery code",
        variant: "destructive",
      });
    },
  });

  const supportMutation = useMutation({
    mutationFn: async (data: SupportMessageForm) => {
      const response = await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your support message has been sent.",
      });
      setSupportForm({ subject: "", message: "", priority: "normal" });
      // Re-fetch messages to show the newly sent one
      // queryClient.invalidateQueries({ queryKey: ['supportMessages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch support messages for the user
  // This is a placeholder. In a real app, you'd likely use useQuery from react-query
  // and handle loading and error states more robustly.
  // For demonstration, we'll mock fetching.
  useEffect(() => {
    setSupportMessagesLoading(true);
    setTimeout(() => {
      setSupportMessages([
        {
          id: 1,
          subject: "Login Issue",
          message: "I can't log in to my account. It says my password is incorrect, but I know it's right.",
          priority: "high" as const,
          status: "open",
          createdAt: new Date().toISOString(),
          adminResponse: "We're looking into this issue. Please try resetting your password in the meantime.",
        },
        {
          id: 2,
          subject: "Feature Request",
          message: "It would be great if you could add a dark mode to the app.",
          priority: "low" as const,
          status: "resolved",
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        },
      ]);
      setSupportMessagesLoading(false);
    }, 1500);
  }, []);


  const handleCopyRecoveryCode = () => {
    if (currentRecoveryCode) {
      navigator.clipboard.writeText(currentRecoveryCode);
      toast({
        title: "Copied!",
        description: "Recovery code copied to clipboard",
      });
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    supportMutation.mutate(supportForm);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
  };

  // Define menuItems here, before the return statement
  const menuItems = [
    {
      id: "account",
      label: "Account",
      icon: User,
      description: "Profile and personal information"
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Recovery code and security settings"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Manage your notification settings"
    },
    {
      id: "support",
      label: "Support",
      icon: MessageSquare,
      description: "Get help and contact support"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50 lg:ml-64">
        <div className="max-w-sm mx-auto lg:max-w-4xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto lg:max-w-4xl px-6 pb-24 lg:ml-64">
        {/* Profile Summary Card */}
        <Card className="mt-6 mb-8 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{user.email.split('@')[0]}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {user.isAdmin ? (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      Manager
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Menu and Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="space-y-3 mb-8">
            <TabsList className={`grid w-full ${user?.isSupportAdmin || user?.isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="support" className={`${(user?.isSupportAdmin || user?.isAdmin) ? '' : 'hidden'} bg-green-100 text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white`}>
                Support
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
          <TabsContent value="account" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Email Address</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      Verified
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Currency</p>
                        <p className="text-sm text-muted-foreground">Display preference</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={toggleCurrency}
                      className="rounded-lg bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white"
                    >
                      {currency}
                    </Button>
                  </div>

                  <Separator />

                  {/* Recovery Code Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-foreground">Recovery Code</p>
                        <p className="text-sm text-muted-foreground">Manage your account recovery options</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Dialog open={showViewRecoveryDialog} onOpenChange={setShowViewRecoveryDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start h-auto p-4"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            <div className="text-left">
                              <p className="font-medium">View Code</p>
                              <p className="text-xs text-muted-foreground">Show current recovery code</p>
                            </div>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Shield className="w-5 h-5" />
                              View Recovery Code
                            </DialogTitle>
                          </DialogHeader>
                          <Form {...viewRecoveryForm}>
                            <form onSubmit={viewRecoveryForm.handleSubmit((data) => viewRecoveryMutation.mutate(data))} className="space-y-4">
                              <Alert className="border-amber-200 bg-amber-50">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-800">
                                  For security, please enter your password to view your recovery code.
                                </AlertDescription>
                              </Alert>

                              <FormField
                                control={viewRecoveryForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="Enter your password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowViewRecoveryDialog(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={viewRecoveryMutation.isPending}
                                  className="flex-1"
                                >
                                  {viewRecoveryMutation.isPending ? "Verifying..." : "View Code"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start h-auto p-4"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            <div className="text-left">
                              <p className="font-medium">Generate New</p>
                              <p className="text-xs text-muted-foreground">Create a new recovery code</p>
                            </div>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <RefreshCw className="w-5 h-5" />
                              Generate New Recovery Code
                            </DialogTitle>
                          </DialogHeader>
                          <Form {...regenerateForm}>
                            <form onSubmit={regenerateForm.handleSubmit((data) => regenerateMutation.mutate(data))} className="space-y-4">
                              <Alert className="border-red-200 bg-red-50">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                  <strong>Warning:</strong> Generating a new recovery code will invalidate your current one. Make sure to save the new code securely.
                                </AlertDescription>
                              </Alert>

                              <FormField
                                control={regenerateForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="Enter your password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowRegenerateDialog(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={regenerateMutation.isPending}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  {regenerateMutation.isPending ? "Generating..." : "Generate New"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-orange-500" />
                  </div>
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <Key className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Your recovery code is essential for account security. Keep it safe and accessible only to you.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">Recovery Code Management</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Access and manage your account recovery code. You'll need your password to view or generate a new code.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Dialog open={showViewRecoveryDialog} onOpenChange={setShowViewRecoveryDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-center"
                                size="sm"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Current Code
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Shield className="w-5 h-5" />
                                  View Recovery Code
                                </DialogTitle>
                              </DialogHeader>
                              <Form {...viewRecoveryForm}>
                                <form onSubmit={viewRecoveryForm.handleSubmit((data) => viewRecoveryMutation.mutate(data))} className="space-y-4">
                                  <Alert className="border-amber-200 bg-amber-50">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800">
                                      For security, please enter your password to view your recovery code.
                                    </AlertDescription>
                                  </Alert>

                                  <FormField
                                    control={viewRecoveryForm.control}
                                    name="password"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                          <Input type="password" placeholder="Enter your password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setShowViewRecoveryDialog(false)}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={viewRecoveryMutation.isPending}
                                      className="flex-1"
                                    >
                                      {viewRecoveryMutation.isPending ? "Verifying..." : "View Code"}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-center"
                                size="sm"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Generate New Code
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <RefreshCw className="w-5 h-5" />
                                  Generate New Recovery Code
                                </DialogTitle>
                              </DialogHeader>
                              <Form {...regenerateForm}>
                                <form onSubmit={regenerateForm.handleSubmit((data) => regenerateMutation.mutate(data))} className="space-y-4">
                                  <Alert className="border-red-200 bg-red-50">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-800">
                                      <strong>Warning:</strong> Generating a new recovery code will invalidate your current one. Make sure to save the new code securely.
                                    </AlertDescription>
                                  </Alert>

                                  <FormField
                                    control={regenerateForm.control}
                                    name="password"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                          <Input type="password" placeholder="Enter your password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setShowRegenerateDialog(false)}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={regenerateMutation.isPending}
                                      variant="destructive"
                                      className="flex-1"
                                    >
                                      {regenerateMutation.isPending ? "Generating..." : "Generate New"}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800 text-sm">Security Tips</p>
                        <ul className="text-xs text-green-700 mt-1 space-y-1">
                          <li>• Store your recovery code in a secure password manager</li>
                          <li>• Never share your recovery code with anyone</li>
                          <li>• Generate a new code if you suspect it's been compromised</li>
                          <li>• Keep multiple secure copies of your recovery code</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-orange-500" />
                  </div>
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts and updates</p>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Price Alerts</p>
                      <p className="text-sm text-muted-foreground">Bitcoin price changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Investment Updates</p>
                      <p className="text-sm text-muted-foreground">Portfolio performance</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Security Alerts</p>
                      <p className="text-sm text-muted-foreground">Login and security events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Marketing</p>
                      <p className="text-sm text-muted-foreground">Product updates and offers</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Support Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Send us a message and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={supportForm.priority}
                      onValueChange={(value) => setSupportForm(prev => ({ ...prev, priority: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="normal">Normal - Standard support</SelectItem>
                        <SelectItem value="high">High - Urgent issue</SelectItem>
                        <SelectItem value="urgent">Urgent - Critical problem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={supportForm.message}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Please describe your issue in detail..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={supportMutation.isPending} className="w-full">
                    {supportMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* My Support Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  My Support Messages
                </CardTitle>
                <CardDescription>
                  View your previous support conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supportMessagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : supportMessages?.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No support messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {supportMessages?.map((message: any) => (
                      <div key={message.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{message.subject}</h4>
                          <Badge
                            variant={message.status === 'resolved' ? 'default' : message.status === 'open' ? 'secondary' : 'outline'}
                          >
                            {message.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{message.message}</p>
                        {message.adminResponse && (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                            <p className="text-sm font-semibold text-green-800 mb-1">Support Response:</p>
                            <p className="text-sm text-green-700">{message.adminResponse}</p>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Admin Tab */}
          {(user?.isSupportAdmin || user?.isAdmin) && (
            <TabsContent value="support" className="space-y-6">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Shield className="w-5 h-5" />
                    Support Admin Dashboard
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Access the customer support message interface to help users with their inquiries.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-6 border border-green-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Customer Support Interface</h3>
                        <p className="text-gray-600">Manage and respond to customer messages</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        View all customer support messages
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Respond to customer inquiries in real-time
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        WhatsApp-style conversation interface
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Track message status and priorities
                      </div>
                    </div>

                    <Button
                      onClick={() => setLocation('/support-admin')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open Support Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </div>

        {/* Help Section */}
        <Card className="mt-8 border-0 shadow-lg">
          <CardContent className="p-0">
            <WhatsAppStyleChat>
              <Button
                variant="ghost"
                className="w-full h-auto p-4 justify-start gap-3 hover:bg-primary/5 rounded-xl"
                data-testid="button-contact-support"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Need help? Contact our support team</p>
                  <p className="text-sm text-muted-foreground">Get assistance with your account, investments, or technical issues</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Button>
            </WhatsAppStyleChat>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="mt-6 border-0 shadow-lg bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
          <CardContent className="p-6">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
        </Tabs>
      </div>

      <BottomNavigation />

      {/* Recovery Code Display Dialog */}
      {showRecoveryCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Your Recovery Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Important:</strong> Save this recovery code securely. You'll need it to reset your password if you forget it.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-gray-100 rounded-lg border text-center">
                <code className="text-lg font-mono font-bold tracking-wider">
                  {currentRecoveryCode}
                </code>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyRecoveryCode}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
                <Button
                  onClick={() => {
                    setShowRecoveryCode(false);
                    setCurrentRecoveryCode("");
                  }}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Use this code on the "Reset Password" page if you forget your password.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
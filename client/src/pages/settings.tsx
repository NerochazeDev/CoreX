import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { ProtectedRoute } from "@/components/protected-route";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useTheme } from "@/contexts/theme-context";
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
  const { theme, setTheme, actualTheme } = useTheme();
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
    defaultValues: {
      password: ""
    }
  });

  const regenerateForm = useForm<PasswordVerificationForm>({
    resolver: zodResolver(passwordVerificationSchema),
    defaultValues: {
      password: ""
    }
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

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Enhanced Header with Gradient */}
        <header className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <Link href="/home">
                  <Button variant="ghost" size="icon" className="h-10 w-10 p-0 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Settings
                  </h1>
                  <p className="text-sm text-white/90 font-medium">Manage your account & preferences</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {/* Profile Summary Card - Match Home Page Style */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            {/* 3D Shadow Base */}
            <div className="absolute top-3 left-3 w-full h-full bg-gradient-to-br from-orange-500/30 to-orange-600/40 rounded-3xl blur-lg"></div>

            {/* Main Card */}
            <Card className="relative bg-gradient-to-br from-orange-500 via-orange-600/90 to-orange-700 dark:from-orange-600 dark:via-orange-700/90 dark:to-orange-800 border border-orange-400/60 dark:border-orange-500/50 rounded-3xl shadow-2xl shadow-orange-600/30 backdrop-blur-xl overflow-hidden">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-orange-500/10 to-orange-600/25 pointer-events-none"></div>

              <CardContent className="relative p-8 text-center">
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="relative group mx-auto w-fit">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 mx-auto">
                      {user.avatar && !user.avatar.startsWith('gradient-') ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : user.avatar && user.avatar.startsWith('gradient-') ? (
                        <div className={`w-full h-full bg-gradient-to-br ${user.avatar.replace('gradient-', '')} flex items-center justify-center`}>
                          <span className="text-2xl font-bold text-white">
                {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">{user.email.split('@')[0]}</h2>
                      <p className="text-orange-100 text-lg">{user.email}</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      {user.isAdmin ? (
                        <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30 px-3 py-1">
                          <Crown className="w-4 h-4 mr-2" />
                          Administrator
                        </Badge>
                      ) : (
                        <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                          Premium Member
                        </Badge>
                      )}
                      <Badge className="bg-green-500/20 text-green-100 border-green-300/30 px-3 py-1">
                        <Shield className="w-4 h-4 mr-2" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Settings Navigation - Orange Theme */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
          <div className="mb-8">
            <TabsList className={`grid w-full h-14 bg-card/50 backdrop-blur-lg border border-border rounded-2xl shadow-lg p-2 ${user?.isSupportAdmin || user?.isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="account" className="gap-2 h-10 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-xl">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2 h-10 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-xl">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 h-10 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-xl">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              {(user?.isSupportAdmin || user?.isAdmin) && (
                <TabsTrigger value="support" className="gap-2 h-10 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Support</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Content Sections - Orange Theme Design */}
          <div className="space-y-6">
            <TabsContent value="account" className="space-y-6">
              <div className="relative">
                <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-orange-500" />
                      </div>
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">Email Address</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">{user.email}</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400">
                          Verified
                        </Badge>
                      </div>

                      <Separator className="bg-orange-200/50 dark:bg-orange-800/50" />

                      <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          <div>
                            <p className="font-medium text-orange-800 dark:text-orange-200">Currency</p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">Display preference</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={toggleCurrency}
                          className="rounded-lg bg-orange-500/10 border-orange-300 text-orange-700 hover:bg-orange-500 hover:text-white dark:bg-orange-900/20 dark:border-orange-600 dark:text-orange-300"
                        >
                          {currency}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div className="flex items-center gap-3">
                          {actualTheme === 'dark' ? (
                            <Moon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <Sun className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          )}
                          <div>
                            <p className="font-medium text-orange-800 dark:text-orange-200">Theme</p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">Appearance preference</p>
                          </div>
                        </div>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger 
                            className="w-32 rounded-lg bg-orange-500/10 border-orange-300 text-orange-700 hover:bg-orange-500 hover:text-white dark:bg-orange-900/20 dark:border-orange-600 dark:text-orange-300"
                            data-testid="select-theme"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light" data-testid="theme-light">
                              <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4" />
                                Light
                              </div>
                            </SelectItem>
                            <SelectItem value="dark" data-testid="theme-dark">
                              <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4" />
                                Dark
                              </div>
                            </SelectItem>
                            <SelectItem value="system" data-testid="theme-system">
                              <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                System
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="relative">
                <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-orange-500" />
                      </div>
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                      <Key className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 dark:text-orange-200">
                        Your recovery code is essential for account security. Keep it safe and accessible only to you.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <Key className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-orange-800 dark:text-orange-200">Recovery Code Management</h4>
                            <p className="text-sm text-orange-600 dark:text-orange-400 mb-3">
                              Access and manage your account recovery code. You'll need your password to view or generate a new code.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Dialog open={showViewRecoveryDialog} onOpenChange={setShowViewRecoveryDialog}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="justify-center border-orange-300 text-orange-700 hover:bg-orange-500 hover:text-white dark:border-orange-600 dark:text-orange-300"
                                    size="sm"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Code
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
                                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                                        >
                                          {viewRecoveryMutation.isPending ? "Generating..." : "View Code"}
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
                                    className="justify-center border-orange-300 text-orange-700 hover:bg-orange-500 hover:text-white dark:border-orange-600 dark:text-orange-300"
                                    size="sm"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Generate New
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <RefreshCw className="w-5 h-5" />
                                      Generate New Recovery Code
                                    </DialogTitle>
                                    <DialogDescription>
                                      Enter your password to generate a new recovery code. This will invalidate your current code.
                                    </DialogDescription>
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="relative">
                <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
                <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-orange-500" />
                      </div>
                      Notification Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">Push Notifications</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Receive alerts and updates</p>
                        </div>
                        <Switch
                          checked={notifications}
                          onCheckedChange={setNotifications}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">Price Alerts</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Bitcoin price changes</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">Investment Updates</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Portfolio performance</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">Security Alerts</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Login and security events</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">Marketing</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Product updates and offers</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Support Admin Tab */}
            {(user?.isSupportAdmin || user?.isAdmin) && (
              <TabsContent value="support" className="space-y-6">
                <div className="relative">
                  <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl blur-sm"></div>
                  <Card className="relative bg-gradient-to-br from-green-500/10 via-green-600/5 to-green-700/10 dark:from-green-600/20 dark:via-green-700/15 dark:to-green-800/20 backdrop-blur-xl border border-green-400/30 dark:border-green-500/30 rounded-2xl shadow-xl shadow-green-600/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <Shield className="w-5 h-5" />
                        Support Admin Dashboard
                      </CardTitle>
                      <CardDescription className="text-green-600 dark:text-green-400">
                        Access the customer support message interface to help users with their inquiries.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-6 border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Customer Support Interface</h3>
                            <p className="text-gray-600 dark:text-gray-400">Manage and respond to customer messages</p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            View all customer support messages
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Respond to customer inquiries in real-time
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            WhatsApp-style conversation interface
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Help Section - Orange Theme */}
        <div className="mt-8 relative max-w-4xl mx-auto">
          <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
          <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
            <CardContent className="p-0">
              <WhatsAppStyleChat>
                <Button
                  variant="ghost"
                  className="w-full h-auto p-3 sm:p-4 justify-start gap-3 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 rounded-xl"
                  data-testid="button-contact-support"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-orange-800 dark:text-orange-200 text-sm sm:text-base">Need help? Contact our support team</p>
                    <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 leading-tight">Get help with your account or technical issues</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                </Button>
              </WhatsAppStyleChat>
            </CardContent>
          </Card>
        </div>

        {/* Logout Section - Orange Theme */}
        <div className="mt-6 relative max-w-4xl mx-auto">
          <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-red-500/20 to-red-600/30 rounded-2xl blur-sm"></div>
          <Card className="relative bg-gradient-to-br from-red-500/10 via-red-600/5 to-red-700/10 dark:from-red-600/20 dark:via-red-700/15 dark:to-red-800/20 backdrop-blur-xl border border-red-400/30 dark:border-red-500/30 rounded-2xl shadow-xl shadow-red-600/20">
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
        </div>
      </main>

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
        
        <BottomNavigation />
      </div>
    </LayoutWrapper>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
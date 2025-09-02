import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Globe, 
  LogOut,
  ChevronRight,
  User,
  Lock,
  ArrowLeft,
  Crown,
  MessageSquare,
  Send,
  Upload,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function SettingsContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { currency, toggleCurrency } = useCurrency();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [notifications, setNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [investmentUpdates, setInvestmentUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  
  // Support chat state
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [hasReceivedAutoReply, setHasReceivedAutoReply] = useState(false);
  const queryClient = useQueryClient();

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

  // Support message functionality
  const sendMessage = useMutation({
    mutationFn: async (messageText: string) => {
      let imageUrl = "";
      
      if (imageFile) {
        const imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
        imageUrl = imageData;
      }

      return await apiRequest('POST', '/api/support/messages', {
        subject: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
        message: messageText,
        priority: "normal",
        imageUrl: imageUrl || undefined,
      });
    },
    onSuccess: () => {
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

  const menuItems = [
    {
      id: "account",
      label: "Account",
      icon: User,
      description: "Profile and personal information"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Manage your notification preferences"
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Security settings and preferences"
    },
    {
      id: "support",
      label: "Support",
      icon: MessageSquare,
      description: "Get help and contact support"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-orange-200/50 dark:border-orange-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 lg:ml-64">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24 lg:ml-64">
        {/* Profile Summary Card */}
        <Card className="mt-6 mb-8 border-0 shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{user.email.split('@')[0]}</h3>
                <p className="text-white/80">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {user.isAdmin ? (
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Manager
                    </Badge>
                  ) : (
                    <Badge className="bg-white/20 text-white border-white/30">
                      Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Menu */}
        <div className="space-y-3 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Card 
                key={item.id}
                className={`cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30' 
                    : 'bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-orange-500/20' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon className={`w-6 h-6 ${isActive ? 'text-orange-500' : 'text-gray-600 dark:text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.label}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      isActive ? 'text-orange-500 rotate-90' : 'text-gray-400'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === "account" && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email Address</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                    <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                      Verified
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Currency Preference</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Display currency for values</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={toggleCurrency}
                      className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    >
                      {currency}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Member Since</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-500" />
                  </div>
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">General app notifications</p>
                    </div>
                    <Switch 
                      checked={notifications} 
                      onCheckedChange={setNotifications}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Price Alerts</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bitcoin price change notifications</p>
                    </div>
                    <Switch 
                      checked={priceAlerts} 
                      onCheckedChange={setPriceAlerts}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Investment Updates</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio and profit notifications</p>
                    </div>
                    <Switch 
                      checked={investmentUpdates} 
                      onCheckedChange={setInvestmentUpdates}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Security Alerts</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Login and security notifications</p>
                    </div>
                    <Switch 
                      checked={securityAlerts} 
                      onCheckedChange={setSecurityAlerts}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-500" />
                  </div>
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Password Protection</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your password is securely encrypted</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                      Secure
                    </Badge>
                  </div>

                  <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="font-medium text-gray-900 dark:text-white">Recovery Code</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Keep your recovery code safe for account recovery purposes.
                    </p>
                    <Link href="/recovery-settings">
                      <Button 
                        variant="outline" 
                        className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                      >
                        Manage Recovery Code
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "support" && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  </div>
                  Support & Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Contact Support Button */}
                  <Dialog open={supportChatOpen} onOpenChange={setSupportChatOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-auto p-6 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                      >
                        <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mr-4">
                          <Send className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-white">Contact Support</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Send a message to our support team</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[420px] h-[600px] p-0 gap-0">
                      {/* Header */}
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
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
                              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                                <MessageSquare className="w-8 h-8 text-orange-500" />
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Welcome to BitVault Pro Support!<br />
                                How can we help you today?
                              </p>
                            </div>
                          )}
                          
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[280px] rounded-2xl px-4 py-2 ${
                                msg.isUser 
                                  ? 'bg-orange-500 text-white rounded-br-md' 
                                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm'
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
                                  msg.isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
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
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t">
                          <div className="flex items-center gap-2">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">Image attached</span>
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
                      <div className="p-4 bg-white dark:bg-gray-900 border-t">
                        <div className="flex items-end gap-2">
                          <div className="flex-1 relative">
                            <Textarea
                              value={currentMessage}
                              onChange={(e) => setCurrentMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Type a message..."
                              className="min-h-[44px] max-h-32 resize-none rounded-full px-4 py-3 pr-12 border-2 focus:border-orange-500"
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
                              className="absolute right-3 top-3 cursor-pointer text-gray-500 hover:text-orange-500 transition-colors"
                            >
                              <Upload className="w-5 h-5" />
                            </label>
                          </div>
                          <Button
                            onClick={handleSendMessage}
                            disabled={(!currentMessage.trim() && !imageFile) || sendMessage.isPending}
                            className="h-11 w-11 rounded-full p-0 bg-orange-500 hover:bg-orange-600"
                          >
                            {sendMessage.isPending ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Quick Help Topics */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Common Help Topics</h4>
                    
                    <div className="grid gap-3">
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Account & Security</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Password changes, recovery codes, account verification</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Investments & Trading</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Investment plans, profits, Bitcoin wallet management</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Technical Support</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">App issues, bugs, performance problems</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sign Out Button */}
        <Card className="mt-8 border-0 shadow-xl">
          <CardContent className="p-6">
            <Button 
              onClick={handleLogout}
              variant="destructive" 
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
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
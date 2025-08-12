
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { 
  Copy, User, Bitcoin, Key, ExternalLink, Shield, ArrowLeft, TrendingUp, 
  Activity, Calendar, Mail, Hash, Award, Wallet, Eye, EyeOff, Settings,
  BarChart3, PieChart, LineChart, DollarSign, Clock, CheckCircle,
  AlertTriangle, Star, Trophy, Target, Zap, Lock, Globe, Smartphone,
  CreditCard, Download, Upload, RefreshCw, Bell, Users, BookOpen,
  HelpCircle, MessageSquare, Share2, Edit, Camera, MapPin, Phone, X, Crown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency } from "@/lib/utils";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useQuery } from "@tanstack/react-query";
import type { Investment, Transaction } from "@shared/schema";
import { ProtectedRoute } from "@/components/protected-route";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function ProfileContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { data: price } = useBitcoinPrice();
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [displayUserId, setDisplayUserId] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    avatar: '',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      showBalance: false,
      showInvestments: false
    }
  });

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSave = async () => {
    if (!uploadedImage) return;
    
    setIsUploadingAvatar(true);
    
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProfileData(prev => ({ ...prev, avatar: uploadedImage }));
      setAvatarDialogOpen(false);
      setUploadedImage(null);
      
      toast({
        title: "Profile Picture Updated",
        description: "Your new profile picture has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = () => {
    setProfileData(prev => ({ ...prev, avatar: '' }));
    setUploadedImage(null);
    toast({
      title: "Profile Picture Removed",
      description: "Your profile picture has been removed.",
    });
  };

  const generateGradientAvatar = () => {
    const gradients = [
      'from-blue-400 to-purple-600',
      'from-green-400 to-blue-500',
      'from-pink-400 to-red-600',
      'from-yellow-400 to-orange-600',
      'from-indigo-400 to-purple-600',
      'from-teal-400 to-cyan-600'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    
    setProfileData(prev => ({ 
      ...prev, 
      avatar: `gradient-${randomGradient}` 
    }));
    
    toast({
      title: "Avatar Generated",
      description: "A new gradient avatar has been created for you.",
    });
  };

  useEffect(() => {
    const userId = Math.floor(Math.random() * (9999 - 3455 + 1)) + 3455;
    setDisplayUserId(userId);
  }, []);

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const fiatValue = parseFloat(user.balance) * (currency === 'USD' ? (price?.usd.price || 0) : (price?.gbp.price || 0));
  const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;
  const totalProfit = investments?.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0) || 0;
  const activeInvestments = investments?.filter(inv => inv.isActive === true).length || 0;
  const completedInvestments = investments?.filter(inv => inv.isActive === false).length || 0;
  const userTransactions = transactions?.filter(tx => tx.userId === user.id).length || 0;
  const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  // Calculate achievement progress
  const achievementProgress = {
    firstInvestment: activeInvestments > 0 || completedInvestments > 0,
    loyalMember: accountAge >= 30,
    activeTrader: userTransactions >= 10,
    bigInvestor: totalInvested >= 0.01,
    profitMaker: totalProfit > 0
  };

  const completedAchievements = Object.values(achievementProgress).filter(Boolean).length;
  const totalAchievements = Object.keys(achievementProgress).length;
  const profileCompleteness = Math.round((completedAchievements / totalAchievements) * 100);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const handleProfileUpdate = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const recentActivity = [
    { type: "investment", title: "New Investment Started", time: "2 hours ago", icon: TrendingUp },
    { type: "profit", title: "Daily Profit Credited", time: "1 day ago", icon: DollarSign },
    { type: "login", title: "Successful Login", time: "2 days ago", icon: Shield },
    { type: "settings", title: "Profile Updated", time: "3 days ago", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-orange-200/50 dark:border-orange-800/50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  Profile Center
                </h1>
                <p className="text-sm text-muted-foreground">Manage your account & preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Profile Information</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        placeholder="Tell us about yourself..."
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          placeholder="City, Country"
                          value={profileData.location}
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input 
                          id="website" 
                          placeholder="https://"
                          value={profileData.website}
                          onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button onClick={handleProfileUpdate} className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                onClick={logout}
                variant="destructive" 
                size="sm" 
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 pb-24">
        {/* Enhanced Profile Header */}
        <Card className="mb-8 overflow-hidden border-0 shadow-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative group">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white/30 shadow-xl transition-all duration-300 group-hover:scale-105">
                    {profileData.avatar && !profileData.avatar.startsWith('gradient-') ? (
                      <AvatarImage src={profileData.avatar} className="object-cover" />
                    ) : profileData.avatar && profileData.avatar.startsWith('gradient-') ? (
                      <div className={`w-full h-full bg-gradient-to-br ${profileData.avatar.replace('gradient-', '')} flex items-center justify-center`}>
                        <span className="text-2xl font-bold text-white">
                          {(profileData.firstName || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-400 to-red-500 text-white">
                        {(profileData.firstName || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 bg-white hover:bg-white/90 text-orange-600 shadow-lg border-2 border-orange-200 hover:border-orange-300 transition-all duration-300">
                      <Camera className="w-5 h-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-orange-500" />
                        Update Profile Picture
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Current/Preview Avatar */}
                      <div className="flex justify-center">
                        <div className="relative">
                          <Avatar className="w-32 h-32 border-4 border-border shadow-lg">
                            {uploadedImage ? (
                              <AvatarImage src={uploadedImage} className="object-cover" />
                            ) : profileData.avatar && !profileData.avatar.startsWith('gradient-') ? (
                              <AvatarImage src={profileData.avatar} className="object-cover" />
                            ) : profileData.avatar && profileData.avatar.startsWith('gradient-') ? (
                              <div className={`w-full h-full bg-gradient-to-br ${profileData.avatar.replace('gradient-', '')} flex items-center justify-center`}>
                                <span className="text-3xl font-bold text-white">
                                  {(profileData.firstName || user.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            ) : (
                              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-orange-400 to-red-500 text-white">
                                {(profileData.firstName || user.email).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                      </div>

                      {/* Upload Options */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                            <Button variant="outline" className="w-full gap-2 cursor-pointer" asChild>
                              <span>
                                <Upload className="w-4 h-4" />
                                Upload New Picture
                              </span>
                            </Button>
                          </label>

                          <Button
                            variant="outline"
                            onClick={generateGradientAvatar}
                            className="w-full gap-2"
                          >
                            <Star className="w-4 h-4" />
                            Generate Avatar
                          </Button>

                          {(profileData.avatar || uploadedImage) && (
                            <Button
                              variant="outline"
                              onClick={handleAvatarRemove}
                              className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                              Remove Picture
                            </Button>
                          )}
                        </div>

                        {uploadedImage && (
                          <div className="border-t pt-4">
                            <div className="flex gap-2">
                              <Button
                                onClick={handleAvatarSave}
                                disabled={isUploadingAvatar}
                                className="flex-1 bg-orange-500 hover:bg-orange-600"
                              >
                                {isUploadingAvatar ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                {isUploadingAvatar ? 'Saving...' : 'Save Picture'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setUploadedImage(null)}
                                disabled={isUploadingAvatar}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground text-center">
                          <p>• Max file size: 5MB</p>
                          <p>• Supported: JPG, PNG, GIF</p>
                          <p>• Recommended: Square images work best</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    {profileData.firstName || profileData.lastName 
                      ? `${profileData.firstName} ${profileData.lastName}`.trim()
                      : user.email.split('@')[0]
                    }
                  </h2>
                  <p className="text-orange-100 text-lg">@{user.email.split('@')[0]} • ID: #{displayUserId}</p>
                  {profileData.bio && (
                    <p className="text-orange-100 text-sm mt-2 max-w-md">{profileData.bio}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
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
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </Badge>
                  {achievementProgress.loyalMember && (
                    <Badge className="bg-purple-500/20 text-purple-100 border-purple-300/30 px-3 py-1">
                      <Trophy className="w-4 h-4 mr-2" />
                      Loyal Member
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{accountAge}</p>
                    <p className="text-orange-100 text-sm">Days Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{userTransactions}</p>
                    <p className="text-orange-100 text-sm">Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{activeInvestments + completedInvestments}</p>
                    <p className="text-orange-100 text-sm">Investments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{profileCompleteness}%</p>
                    <p className="text-orange-100 text-sm">Profile Complete</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 h-12 mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Award className="w-4 h-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Balance Overview */}
              <Card className="col-span-1 md:col-span-2 xl:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-orange-500" />
                    Current Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-4xl font-bold text-foreground">{formatBitcoin(user.balance)} BTC</p>
                    <p className="text-lg text-muted-foreground">
                      ≈ {price ? formatCurrency(fiatValue, currency) : 'Loading...'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                      className="gap-2"
                    >
                      {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showSensitiveInfo ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>
                  {showSensitiveInfo && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="font-medium">{formatBitcoin(user.balance)} BTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">In Investments</span>
                        <span className="font-medium">{formatBitcoin(totalInvested.toString())} BTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Profit</span>
                        <span className="font-medium text-green-600">+{formatBitcoin(totalProfit.toString())} BTC</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Investment Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{activeInvestments}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{completedInvestments}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">95.2%</span>
                    </div>
                    <Progress value={95.2} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Account Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Account Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Email Verified</span>
                      </div>
                      <Badge variant="secondary" className="text-green-600">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">2FA Enabled</span>
                      </div>
                      <Badge variant="secondary" className="text-green-600">Secure</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Profile Complete</span>
                      </div>
                      <Badge variant="secondary">{profileCompleteness}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    Portfolio Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Investments</span>
                      <span className="text-sm text-muted-foreground">{formatBitcoin(totalInvested.toString())} BTC</span>
                    </div>
                    <Progress value={totalInvested > 0 ? 75 : 0} className="h-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Available Balance</span>
                      <span className="text-sm text-muted-foreground">{formatBitcoin(user.balance)} BTC</span>
                    </div>
                    <Progress value={parseFloat(user.balance) > 0 ? 25 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-green-500" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        +{totalProfit > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Total Return</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{accountAge}</p>
                      <p className="text-sm text-muted-foreground">Days Investing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                          <p className="text-xs text-muted-foreground">
                            Activity completed successfully with no issues detected.
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={achievementProgress.firstInvestment ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievementProgress.firstInvestment ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      <Target className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">First Investment</h3>
                      <p className="text-sm text-muted-foreground">Make your first investment</p>
                    </div>
                    {achievementProgress.firstInvestment && <CheckCircle className="w-6 h-6 text-green-500" />}
                  </div>
                </CardContent>
              </Card>

              <Card className={achievementProgress.loyalMember ? "border-purple-200 bg-purple-50/50 dark:bg-purple-950/20" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievementProgress.loyalMember ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Loyal Member</h3>
                      <p className="text-sm text-muted-foreground">30+ days as a member</p>
                    </div>
                    {achievementProgress.loyalMember && <CheckCircle className="w-6 h-6 text-purple-500" />}
                  </div>
                </CardContent>
              </Card>

              <Card className={achievementProgress.activeTrader ? "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievementProgress.activeTrader ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Active Trader</h3>
                      <p className="text-sm text-muted-foreground">Complete 10+ transactions</p>
                    </div>
                    {achievementProgress.activeTrader && <CheckCircle className="w-6 h-6 text-blue-500" />}
                  </div>
                </CardContent>
              </Card>

              <Card className={achievementProgress.profitMaker ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievementProgress.profitMaker ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      <Star className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Profit Maker</h3>
                      <p className="text-sm text-muted-foreground">Earn your first profit</p>
                    </div>
                    {achievementProgress.profitMaker && <CheckCircle className="w-6 h-6 text-green-500" />}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Achievement Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Completed Achievements</span>
                    <span className="font-medium">{completedAchievements} of {totalAchievements}</span>
                  </div>
                  <Progress value={profileCompleteness} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    Keep completing achievements to unlock exclusive rewards and features!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Email Verified</span>
                      </div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium">2FA Setup</span>
                      </div>
                      <Button size="sm" variant="outline">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">Strong Password</span>
                      </div>
                      <Badge variant="secondary">Good</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-500" />
                    Account Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last Login</span>
                      <span className="text-sm text-muted-foreground">Today, 2:30 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Login Location</span>
                      <span className="text-sm text-muted-foreground">Unknown Location</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Device</span>
                      <span className="text-sm text-muted-foreground">Web Browser</span>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      View Login History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Wallet Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Custodial Security System
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Your Bitcoin is secured in our institutional-grade vault</li>
                        <li>• Multi-signature security protocols</li>
                        <li>• Cold storage for maximum protection</li>
                        <li>• 24/7 monitoring and threat detection</li>
                        <li>• Insurance coverage for digital assets</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-500" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Investment updates and alerts</p>
                    </div>
                    <Switch 
                      checked={profileData.notifications.email}
                      onCheckedChange={(checked) => 
                        setProfileData({
                          ...profileData, 
                          notifications: {...profileData.notifications, email: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Browser notifications</p>
                    </div>
                    <Switch 
                      checked={profileData.notifications.push}
                      onCheckedChange={(checked) => 
                        setProfileData({
                          ...profileData, 
                          notifications: {...profileData.notifications, push: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Important security alerts</p>
                    </div>
                    <Switch 
                      checked={profileData.notifications.sms}
                      onCheckedChange={(checked) => 
                        setProfileData({
                          ...profileData, 
                          notifications: {...profileData.notifications, sms: checked}
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-500" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Profile Visibility</p>
                      <p className="text-sm text-muted-foreground">Show profile to other users</p>
                    </div>
                    <Switch 
                      checked={profileData.privacy.profileVisible}
                      onCheckedChange={(checked) => 
                        setProfileData({
                          ...profileData, 
                          privacy: {...profileData.privacy, profileVisible: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Balance</p>
                      <p className="text-sm text-muted-foreground">Display balance publicly</p>
                    </div>
                    <Switch 
                      checked={profileData.privacy.showBalance}
                      onCheckedChange={(checked) => 
                        setProfileData({
                          ...profileData, 
                          privacy: {...profileData.privacy, showBalance: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Investments</p>
                      <p className="text-sm text-muted-foreground">Display investment activity</p>
                    </div>
                    <Switch 
                      checked={profileData.privacy.showInvestments}
                      onCheckedChange={(checked) => 
                        setProfileData({
                          ...profileData, 
                          privacy: {...profileData.privacy, showInvestments: checked}
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sync Account
                  </Button>
                  <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                    <AlertTriangle className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link href="/settings">
            <Button variant="outline" className="w-full h-14 gap-2">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Button>
          </Link>
          <Link href="/transactions">
            <Button variant="outline" className="w-full h-14 gap-2">
              <Activity className="w-5 h-5" />
              <span>History</span>
            </Button>
          </Link>
          <Link href="/investment">
            <Button variant="outline" className="w-full h-14 gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Invest</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full h-14 gap-2"
            onClick={() => copyToClipboard(user.email, 'Email')}
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

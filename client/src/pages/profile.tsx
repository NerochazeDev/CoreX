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
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency } from "@/lib/utils";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Investment, Transaction } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ProtectedRoute } from "@/components/protected-route";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function ProfileContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { data: price } = useBitcoinPrice();
  const queryClient = useQueryClient();
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [displayUserId, setDisplayUserId] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    bio: '',
    website: '',
    avatar: '',
  });

  // Initialize profile data from user when user data is available
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        country: user.country || '',
        bio: user.bio || '',
        website: user.website || '',
        avatar: user.avatar || '',
      }));
    }
  }, [user]);

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest('PATCH', '/api/me/profile', profileData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Profile Updated Successfully! 🎉",
        description: "Your changes have been saved and will be visible shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 400x400 while maintaining aspect ratio)
        const maxSize = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression (0.8 quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Increased to 10MB since we'll compress
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      try {
        setIsUploadingAvatar(true);
        toast({
          title: "Processing image...",
          description: "Compressing your image for faster upload.",
        });

        const compressedImage = await compressImage(file);
        setUploadedImage(compressedImage);

        toast({
          title: "Image ready",
          description: "Your image has been processed and is ready to save.",
        });
      } catch (error) {
        toast({
          title: "Processing failed",
          description: "Failed to process your image. Please try a different file.",
          variant: "destructive"
        });
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleAvatarSave = async () => {
    if (!uploadedImage) return;

    setIsUploadingAvatar(true);

    try {
      // Update profile with new avatar using the correct mutation
      const result = await updateProfileMutation.mutateAsync({ avatar: uploadedImage });

      setProfileData(prev => ({ ...prev, avatar: uploadedImage }));
      setAvatarDialogOpen(false);
      setUploadedImage(null);

      toast({
        title: "Profile Picture Updated",
        description: "Your new profile picture has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await updateProfileMutation.mutateAsync({ avatar: '' });

      setProfileData(prev => ({ ...prev, avatar: '' }));
      setUploadedImage(null);
      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      toast({
        title: "Removal Failed",
        description: error?.message || "Failed to remove profile picture. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateGradientAvatar = async () => {
    const gradients = [
      'from-blue-400 to-purple-600',
      'from-green-400 to-blue-500',
      'from-pink-400 to-red-600',
      'from-yellow-400 to-orange-600',
      'from-indigo-400 to-purple-600',
      'from-teal-400 to-cyan-600'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    const gradientAvatar = `gradient-${randomGradient}`;

    try {
      await updateProfileMutation.mutateAsync({ avatar: gradientAvatar });

      setProfileData(prev => ({ 
        ...prev, 
        avatar: gradientAvatar
      }));

      toast({
        title: "Avatar Generated",
        description: "A new gradient avatar has been created for you.",
      });
    } catch (error: any) {
      console.error('Gradient avatar generation error:', error);
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate new avatar. Please try again.",
        variant: "destructive"
      });
    }
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

  const fiatValue = user ? parseFloat(user.balance) * (currency === 'USD' ? (price?.usd.price || 0) : (price?.gbp.price || 0)) : 0;
  const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;
  const totalProfit = investments?.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0) || 0;
  const activeInvestments = investments?.filter(inv => inv.isActive === true).length || 0;
  const completedInvestments = investments?.filter(inv => inv.isActive === false).length || 0;
  const userTransactions = user ? transactions?.filter(tx => tx.userId === user.id).length || 0 : 0;
  const accountAge = user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

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

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleProfileUpdate = async () => {
    try {
      await updateProfileMutation.mutateAsync(profileData);

      // Close dialog and show success feedback
      setIsEditDialogOpen(false);

      // Force a page reload to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header - Match Home Page Style */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 rounded-full hover:bg-primary/10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">Profile</h1>
                <p className="text-sm text-muted-foreground">
                  {user.firstName || user.email?.split('@')[0]}'s Profile
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10 border-primary/20">
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
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
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          placeholder="+1 (555) 123-4567"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
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
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleProfileUpdate} 
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
                        disabled={updateProfileMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={logout}
                variant="outline" 
                size="sm" 
                className="gap-2 text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {/* Main Profile Card - Match Home Page Style */}
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
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-white/30 shadow-xl transition-all duration-300 group-hover:scale-105 mx-auto">
                        {profileData.avatar && !profileData.avatar.startsWith('gradient-') ? (
                          <AvatarImage src={profileData.avatar} className="object-cover" />
                        ) : profileData.avatar && profileData.avatar.startsWith('gradient-') ? (
                          <div className={`w-full h-full bg-gradient-to-br ${profileData.avatar.replace('gradient-', '')} flex items-center justify-center`}>
                            <span className="text-2xl font-bold text-white">
                              {(profileData.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-400 to-red-500 text-white">
                            {(profileData.firstName || user?.email || 'U').charAt(0).toUpperCase()}
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
                            <Avatar className="w-32 h-32 border-4 border-border shadow-lg">
                              {uploadedImage ? (
                                <AvatarImage src={uploadedImage} className="object-cover" />
                              ) : profileData.avatar && !profileData.avatar.startsWith('gradient-') ? (
                                <AvatarImage src={profileData.avatar} className="object-cover" />
                              ) : profileData.avatar && profileData.avatar.startsWith('gradient-') ? (
                                <div className={`w-full h-full bg-gradient-to-br ${profileData.avatar.replace('gradient-', '')} flex items-center justify-center`}>
                                  <span className="text-3xl font-bold text-white">
                                    {(profileData.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              ) : (
                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-orange-400 to-red-500 text-white">
                                  {(profileData.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
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
                                  disabled={isUploadingAvatar}
                                />
                                <Button 
                                  variant="outline" 
                                  className="w-full gap-2 cursor-pointer" 
                                  asChild
                                  disabled={isUploadingAvatar}
                                >
                                  <span>
                                    {isUploadingAvatar ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4" />
                                    )}
                                    {isUploadingAvatar ? 'Processing...' : 'Upload New Picture'}
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
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* User Info */}
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">
                        {profileData.firstName || profileData.lastName 
                          ? `${profileData.firstName} ${profileData.lastName}`.trim()
                          : user?.email?.split('@')[0] || 'User'
                        }
                      </h2>
                      <p className="text-orange-100 text-lg">@{user?.email?.split('@')[0] || 'user'} • ID: #{displayUserId}</p>
                      {profileData.bio && (
                        <p className="text-orange-100 text-sm mt-2 max-w-md mx-auto">{profileData.bio}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      {user?.isAdmin ? (
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
          </div>
        </div>

        {/* Stats Overview - Orange Theme Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Portfolio Balance</p>
                    <p className="text-3xl font-bold text-orange-800 dark:text-orange-100">
                      {showSensitiveInfo ? formatBitcoin(user?.balance || '0') : '••••••••'}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      BTC
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Wallet className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Total Profit</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {showSensitiveInfo ? `+${formatBitcoin(totalProfit.toString())}` : '••••••'}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      BTC earned
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <TrendingUp className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Active Investments</p>
                    <p className="text-3xl font-bold text-orange-800 dark:text-orange-100">
                      {activeInvestments}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      Currently earning
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Activity className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Account Security & Achievement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  Account Security
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
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Account Secured</span>
                    </div>
                    <Badge className="bg-green-500">Protected</Badge>
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
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Profile Completion</span>
                    <span className="font-medium">{completedAchievements} of {totalAchievements}</span>
                  </div>
                  <Progress value={profileCompleteness} className="h-3" />
                  <div className="grid grid-cols-2 gap-2">
                    {achievementProgress.firstInvestment && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 text-xs">
                        <Target className="w-3 h-3 mr-1" />
                        First Investment
                      </Badge>
                    )}
                    {achievementProgress.loyalMember && (
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 text-xs">
                        <Trophy className="w-3 h-3 mr-1" />
                        Loyal Member
                      </Badge>
                    )}
                    {achievementProgress.activeTrader && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Active Trader
                      </Badge>
                    )}
                    {achievementProgress.profitMaker && (
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Profit Maker
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Action Buttons - Match Home Page Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link href="/settings">
            <Button variant="outline" className="w-full h-14 gap-2 hover:bg-orange-50 border-orange-200 hover:border-orange-300">
              <Settings className="w-5 h-5 text-orange-600" />
              <span>Settings</span>
            </Button>
          </Link>
          <Link href="/transactions">
            <Button variant="outline" className="w-full h-14 gap-2 hover:bg-orange-50 border-orange-200 hover:border-orange-300">
              <Activity className="w-5 h-5 text-orange-600" />
              <span>History</span>
            </Button>
          </Link>
          <Link href="/investment">
            <Button variant="outline" className="w-full h-14 gap-2 hover:bg-orange-50 border-orange-200 hover:border-orange-300">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span>Invest</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full h-14 gap-2 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
          >
            {showSensitiveInfo ? <EyeOff className="w-5 h-5 text-orange-600" /> : <Eye className="w-5 h-5 text-orange-600" />}
            <span>{showSensitiveInfo ? 'Hide' : 'Show'}</span>
          </Button>
        </div>
      </main>

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
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { 
  User, Bitcoin, ArrowLeft, Edit, Camera, Shield, RefreshCw, CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Link } from "wouter";
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

function ProfileContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { data: price } = useBitcoinPrice();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    website: '',
    avatar: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        website: user.website || '',
        avatar: user.avatar || '',
      }));
    }
  }, [user]);

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest('PATCH', '/api/me/profile', profileData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
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
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      try {
        setIsUploadingAvatar(true);
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
      await updateProfileMutation.mutateAsync({ avatar: uploadedImage });
      setProfileData(prev => ({ ...prev, avatar: uploadedImage }));
      setAvatarDialogOpen(false);
      setUploadedImage(null);
      
      toast({
        title: "Profile Picture Updated",
        description: "Your new profile picture has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await updateProfileMutation.mutateAsync(profileData);
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  };

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const fiatValue = parseFloat(user.balance) * (currency === 'USD' ? (price?.usd.price || 0) : (price?.gbp.price || 0));
  const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;
  const totalProfit = investments?.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0) || 0;
  const activeInvestments = investments?.filter(inv => inv.isActive === true).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-orange-200/50 dark:border-orange-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Profile
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account information</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                        className="max-h-24"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        placeholder="https://example.com"
                        value={profileData.website}
                        onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleProfileUpdate} 
                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pb-24 lg:ml-64">
        {/* Profile Header */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-white/30 shadow-xl">
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
                
                <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 bg-white hover:bg-white/90 text-orange-600 shadow-lg">
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
                      <div className="flex justify-center">
                        <Avatar className="w-32 h-32 border-4 border-border shadow-lg">
                          {uploadedImage ? (
                            <AvatarImage src={uploadedImage} className="object-cover" />
                          ) : profileData.avatar && !profileData.avatar.startsWith('gradient-') ? (
                            <AvatarImage src={profileData.avatar} className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-orange-400 to-red-500 text-white">
                              {(profileData.firstName || user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>

                      <div className="space-y-4">
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
                            className="w-full gap-2" 
                            asChild
                            disabled={isUploadingAvatar}
                          >
                            <span>
                              {isUploadingAvatar ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Camera className="w-4 h-4" />
                              )}
                              {isUploadingAvatar ? 'Processing...' : 'Upload Picture'}
                            </span>
                          </Button>
                        </label>

                        {uploadedImage && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleAvatarSave}
                              disabled={isUploadingAvatar}
                              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                            >
                              {isUploadingAvatar ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Save Picture
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {setUploadedImage(null); setAvatarDialogOpen(false);}}
                              disabled={isUploadingAvatar}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}

                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          <p>• Max file size: 10MB</p>
                          <p>• Supported: JPG, PNG, GIF</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white">
                  {profileData.firstName && profileData.lastName 
                    ? `${profileData.firstName} ${profileData.lastName}`
                    : user.email.split('@')[0]
                  }
                </h2>
                <p className="text-white/80 text-lg">{user.email}</p>
                {profileData.bio && (
                  <p className="text-white/90 mt-2">{profileData.bio}</p>
                )}
                {profileData.website && (
                  <a 
                    href={profileData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/90 underline hover:text-white mt-1 inline-block"
                  >
                    {profileData.website}
                  </a>
                )}
                
                <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                  {user.isAdmin && (
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Manager
                    </Badge>
                  )}
                  <Badge className="bg-white/20 text-white border-white/30">
                    Member since {new Date(user.createdAt).getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Overview */}
        <Card className="mb-8 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-orange-500" />
              </div>
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border border-orange-200/50 dark:border-orange-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Bitcoin className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Balance</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatBitcoin(parseFloat(user.balance))}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(fiatValue, currency)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200/50 dark:border-green-800/50">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Investments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeInvestments}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {formatBitcoin(totalInvested)} invested
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200/50 dark:border-blue-800/50">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatBitcoin(totalProfit)}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    All-time earnings
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
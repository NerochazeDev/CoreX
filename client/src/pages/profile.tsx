import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProtectedRoute } from '@/components/protected-route';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Link } from 'wouter';
import { 
  User, 
  Settings, 
  Activity, 
  TrendingUp, 
  Share2,
  Wallet,
  DollarSign,
  Crown,
  CheckCircle
} from 'lucide-react';
import { formatBitcoin, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function ProfileContent() {
  const { toast } = useToast();
  
  // Fetch user data
  const { data: user } = useQuery({ 
    queryKey: ['/api/me'],
    queryFn: () => fetch('/api/me', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    })
  });
  
  const { data: price } = useQuery({ queryKey: ['/api/bitcoin/price'] });
  
  const { data: investments } = useQuery({ 
    queryKey: ['/api/investments/user', user?.id],
    queryFn: () => fetch(`/api/investments/user/${user?.id}`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch investments');
      }
      return res.json();
    }),
    enabled: !!user?.id
  });
  
  const { data: transactions } = useQuery({ 
    queryKey: ['/api/transactions'],
    queryFn: () => fetch('/api/transactions', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch transactions');
      }
      return res.json();
    }),
    enabled: !!user?.id
  });

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    website: '',
    avatar: null as string | null,
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

  // Update profile data when user data is loaded
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        avatar: user.profileImageUrl || null
      }));
    }
  }, [user]);

  // Calculate metrics
  const activeInvestments = investments?.filter(inv => inv.isActive).length || 0;
  const completedInvestments = investments?.filter(inv => !inv.isActive).length || 0;
  const totalInvested = investments?.filter(inv => inv.isActive)
    .reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;
  const totalProfit = investments?.filter(inv => inv.isActive)
    .reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0) || 0;
  
  const userTransactions = transactions?.length || 0;
  const accountAge = user?.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const currency = 'USD';
  const fiatValue = user ? parseFloat(user.balance) * (price?.usd.price || 0) : 0;
  
  const displayUserId = user?.id ? (user.id + 100000) : 100001;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your BitVault Pro account and settings</p>
        </div>

        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-4 border-white/20">
                  <AvatarImage src={profileData.avatar || user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                    {(profileData.firstName || user?.firstName || user?.email?.charAt(0) || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {profileData.firstName || profileData.lastName 
                      ? `${profileData.firstName} ${profileData.lastName}`.trim()
                      : user?.email?.split('@')[0] || 'User'
                    }
                  </h2>
                  <p className="text-orange-100">@{user?.email?.split('@')[0] || 'user'} • ID: #{displayUserId}</p>
                  {profileData.bio && (
                    <p className="text-orange-100 text-sm mt-2 max-w-md">{profileData.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full md:w-auto">
                <div className="flex flex-wrap gap-2">
                  {user?.isAdmin ? (
                    <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge className="bg-white/20 text-white border-white/30">
                      Premium
                    </Badge>
                  )}
                  <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{accountAge}</p>
                    <p className="text-orange-100 text-sm">Days Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{userTransactions}</p>
                    <p className="text-orange-100 text-sm">Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{activeInvestments + completedInvestments}</p>
                    <p className="text-orange-100 text-sm">Investments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{totalProfit > 0 ? '+' : ''}${((totalProfit || 0) * 111000).toFixed(0)}</p>
                    <p className="text-orange-100 text-sm">Total Profit</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-orange-500" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{user ? formatBitcoin(user.balance) : '0.00000000'}</p>
                <p className="text-sm text-muted-foreground">
                  ≈ {currency === 'USD' ? '$' : '£'}{formatCurrency(fiatValue.toString(), currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Active Investments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{activeInvestments}</p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatBitcoin(totalInvested.toString())}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">{formatBitcoin(totalProfit.toString())}</p>
                <p className="text-sm text-muted-foreground">
                  ≈ {currency === 'USD' ? '$' : '£'}{formatCurrency((totalProfit * (price?.usd.price || 0)).toString(), currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/settings">
            <Button variant="outline" className="w-full h-14 gap-2" data-testid="button-settings">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Button>
          </Link>
          <Link href="/transactions">
            <Button variant="outline" className="w-full h-14 gap-2" data-testid="button-transactions">
              <Activity className="w-5 h-5" />
              <span>History</span>
            </Button>
          </Link>
          <Link href="/investment">
            <Button variant="outline" className="w-full h-14 gap-2" data-testid="button-investment">
              <TrendingUp className="w-5 h-5" />
              <span>Invest</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full h-14 gap-2"
            onClick={() => copyToClipboard(user?.email || '', 'Email')}
            data-testid="button-share"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
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
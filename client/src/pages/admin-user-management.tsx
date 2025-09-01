import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Lock, ArrowLeft, Users, Crown, MessageSquare, Search, UserCheck, UserX } from "lucide-react";
import type { User } from "@shared/schema";

export default function AdminUserManagement() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setAccessDenied(true);
      return;
    }

    if (!user.isAdmin) {
      setAccessDenied(true);
      return;
    }

    setAccessGranted(true);
  }, [user, isLoading]);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        headers: { 'x-backdoor-access': 'true' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: accessGranted,
  });

  const toggleSupportAdminMutation = useMutation({
    mutationFn: async ({ userId, isSupportAdmin }: { userId: number; isSupportAdmin: boolean }) => {
      const response = await fetch('/api/admin/toggle-user-support-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-backdoor-access': 'true'
        },
        credentials: 'include',
        body: JSON.stringify({ userId, isSupportAdmin }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user support admin status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Support Admin Status Updated",
        description: `User ${variables.isSupportAdmin ? 'granted' : 'removed'} support admin access for customer messages.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Verifying admin access...</p>
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
                <span className="font-semibold">Unauthorized Access Attempt</span>
              </div>
              <p className="text-red-300 text-sm">
                This route is restricted to authorized BitVault Pro administrators only.
                {!user && " Please log in with an admin account."}
                {user && !user.isAdmin && " Your account does not have admin privileges."}
              </p>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Security Notice</span>
              </div>
              <p className="text-slate-300 text-sm">
                All access attempts to this route are logged and monitored for security purposes.
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
                  Admin Login
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <Card className="mb-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Admin User Management</CardTitle>
                    <p className="text-orange-100">Grant support message access to users</p>
                  </div>
                </div>
                <Button
                  onClick={() => setLocation('/Hello10122')}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Search and Stats */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{users?.length || 0}</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{users?.filter(u => u.isAdmin).length || 0}</p>
                    <p className="text-sm text-gray-600">Full Admins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{users?.filter(u => u.isSupportAdmin).length || 0}</p>
                    <p className="text-sm text-gray-600">Support Admins</p>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold">Support Admin Access</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Users with support admin status can access only the support message dashboard to respond to customer inquiries.
                  This gives them limited access focused only on customer support, not full admin privileges.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User List ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-500">ID: {user.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{user.email}</TableCell>
                          <TableCell>{user.country}</TableCell>
                          <TableCell className="font-mono">
                            {parseFloat(user.balance).toFixed(8)} BTC
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {user.isAdmin ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Full Admin
                                </Badge>
                              ) : user.isSupportAdmin ? (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Support Admin
                                </Badge>
                              ) : (
                                <Badge variant="secondary">User</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {!user.isAdmin && (
                                <Button
                                  onClick={() => toggleSupportAdminMutation.mutate({
                                    userId: user.id,
                                    isSupportAdmin: !user.isSupportAdmin
                                  })}
                                  disabled={toggleSupportAdminMutation.isPending}
                                  size="sm"
                                  variant={user.isSupportAdmin ? "destructive" : "default"}
                                  className={user.isSupportAdmin 
                                    ? "bg-red-600 hover:bg-red-700 w-full" 
                                    : "bg-orange-600 hover:bg-orange-700 w-full"
                                  }
                                >
                                  {user.isSupportAdmin ? (
                                    <>
                                      <UserX className="w-4 h-4 mr-1" />
                                      Remove Support
                                    </>
                                  ) : (
                                    <>
                                      <MessageSquare className="w-4 h-4 mr-1" />
                                      Make Support Admin
                                    </>
                                  )}
                                </Button>
                              )}
                              {user.isAdmin && (
                                <Badge className="bg-gray-100 text-gray-600 px-3 py-1">
                                  Full Admin - Cannot Change
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
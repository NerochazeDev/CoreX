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
import { Shield, AlertTriangle, Lock, ArrowLeft, Users, Crown, MessageSquare, Search, UserCheck, UserX, Eye, Edit, Trash2, Filter, SortAsc, SortDesc, ChevronLeft, ChevronRight, MoreVertical, CheckSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import type { User } from "@shared/schema";
import type { 
  UserManagementResponse, 
  AdminUser, 
  UserPagination, 
  BulkActionRequest, 
  BulkActionResponse, 
  UserRole, 
  SortField, 
  SortOrder 
} from "@/types/admin";

export default function AdminUserManagement() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [roleFilter, setRoleFilter] = useState<UserRole>("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [bulkAction, setBulkAction] = useState("");

  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
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

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery<UserManagementResponse>({
    queryKey: ['/api/admin/users', currentPage, pageSize, debouncedSearchTerm, roleFilter, sortBy, sortOrder],
    queryFn: async (): Promise<UserManagementResponse> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: debouncedSearchTerm,
        role: roleFilter,
        sortBy,
        sortOrder
      });
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      return response.json();
    },
    enabled: accessGranted,
    retry: 2,
    retryDelay: 1000,
  });

  const { data: userDetail } = useQuery<{ user: AdminUser }>({
    queryKey: ['/api/admin/users', selectedUser?.id],
    queryFn: async (): Promise<{ user: AdminUser }> => {
      if (!selectedUser?.id) throw new Error('User ID is required');
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch user details');
      }
      return response.json();
    },
    enabled: !!selectedUser?.id,
  });

  const toggleSupportAdminMutation = useMutation({
    mutationFn: async ({ userId, isSupportAdmin }: { userId: number; isSupportAdmin: boolean }) => {
      const response = await fetch('/api/admin/toggle-user-support-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

  const users: AdminUser[] = usersData?.users || [];
  const pagination: UserPagination = usersData?.pagination || { 
    page: 1, 
    totalPages: 1, 
    total: 0, 
    hasNext: false, 
    hasPrev: false,
    limit: pageSize
  };

  const bulkActionMutation = useMutation<BulkActionResponse, Error, BulkActionRequest>({
    mutationFn: async (request: BulkActionRequest): Promise<BulkActionResponse> => {
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to perform bulk action');
      }

      return response.json();
    },
    onSuccess: (data: BulkActionResponse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setSelectedUsers([]);
      setBulkAction("");
      toast({
        title: "Bulk Action Completed",
        description: `Successfully processed ${data.successful} users. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
                onClick={() => setLocation('/home')}
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
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1); // Reset to first page when searching
                        }}
                        className="pl-10 w-80"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={(value: UserRole) => {
                      setRoleFilter(value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}>
                      <SelectTrigger className="w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Users</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="support">Support Staff</SelectItem>
                        <SelectItem value="user">Regular Users</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                      const [field, order] = value.split('-') as [SortField, SortOrder];
                      setSortBy(field);
                      setSortOrder(order);
                      setCurrentPage(1); // Reset to first page when sorting changes
                    }}>
                      <SelectTrigger className="w-48">
                        {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                        <SelectItem value="name-desc">Name Z-A</SelectItem>
                        <SelectItem value="email-asc">Email A-Z</SelectItem>
                        <SelectItem value="email-desc">Email Z-A</SelectItem>
                        <SelectItem value="balance-desc">Balance High-Low</SelectItem>
                        <SelectItem value="balance-asc">Balance Low-High</SelectItem>
                        <SelectItem value="createdAt-desc">Newest First</SelectItem>
                        <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-500">per page</span>
                  </div>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">{selectedUsers.length} users selected</span>
                    <div className="flex gap-2 ml-auto">
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Bulk actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="updateSupportAdmin-true">Grant Support Access</SelectItem>
                          <SelectItem value="updateSupportAdmin-false">Remove Support Access</SelectItem>
                          <SelectItem value="delete">Delete Users</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          if (bulkAction) {
                            const [action, value] = bulkAction.split('-') as [BulkActionRequest['action'], string];
                            bulkActionMutation.mutate({
                              action,
                              userIds: selectedUsers,
                              value: value === 'true' ? true : value === 'false' ? false : value
                            });
                          }
                        }}
                        disabled={!bulkAction || bulkActionMutation.isPending}
                        size="sm"
                      >
                        Apply Action
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUsers([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{pagination.total || 0}</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{users.filter((u) => u.isAdmin).length || 0}</p>
                    <p className="text-sm text-gray-600">Full Admins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{users.filter((u) => u.isSupportAdmin).length || 0}</p>
                    <p className="text-sm text-gray-600">Support Admins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedUsers.length}</p>
                    <p className="text-sm text-gray-600">Selected</p>
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
                User List ({pagination.total} total, showing {users.length})
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
              ) : users.length === 0 ? (
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
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers(users.map((u) => u.id));
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className={selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                            />
                          </TableCell>
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
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>User Details - {user.firstName} {user.lastName}</DialogTitle>
                                  </DialogHeader>
                                  {selectedUser?.id === user.id && (
                                    <UserDetailView user={userDetail?.user || user} />
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              {!user.isAdmin && (
                                <Button
                                  onClick={() => toggleSupportAdminMutation.mutate({
                                    userId: user.id,
                                    isSupportAdmin: !user.isSupportAdmin
                                  })}
                                  disabled={toggleSupportAdminMutation.isPending}
                                  size="sm"
                                  variant={user.isSupportAdmin ? "destructive" : "default"}
                                >
                                  {user.isSupportAdmin ? (
                                    <UserX className="w-4 h-4" />
                                  ) : (
                                    <MessageSquare className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              
                              {user.isAdmin && (
                                <Badge className="bg-gray-100 text-gray-600">
                                  Admin
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pageSize) + 1} to {Math.min(pagination.page * pageSize, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNumber = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                        return (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className="w-10"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={!pagination.hasNext}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
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

// User Detail Component
function UserDetailView({ user }: { user: any }) {
  if (!user) return <div>Loading user details...</div>;

  return (
    <div className="space-y-6">
      {/* User Profile */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{user.firstName} {user.lastName}</h3>
                <p className="text-gray-600">ID: {user.id}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Country:</strong>
                <p>{user.country || 'Not specified'}</p>
              </div>
              <div>
                <strong>Phone:</strong>
                <p>{user.phone || 'Not provided'}</p>
              </div>
              <div>
                <strong>Registration:</strong>
                <p>{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <strong>Account Type:</strong>
                <p>
                  {user.isAdmin ? 'Full Administrator' : 
                   user.isSupportAdmin ? 'Support Administrator' : 
                   'Regular User'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance & Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Current Balance:</strong>
              <p className="text-2xl font-bold font-mono text-green-600">
                {parseFloat(user.balance).toFixed(8)} BTC
              </p>
            </div>
            <div>
              <strong>Bitcoin Address:</strong>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                {user.bitcoinAddress || 'Not generated'}
              </p>
            </div>
            <div>
              <strong>Wallet Status:</strong>
              <Badge variant={user.hasWallet ? "default" : "secondary"}>
                {user.hasWallet ? 'Wallet Created' : 'No Wallet'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {user.investments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.investments.slice(0, 3).map((investment: any) => (
                <div key={investment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">Investment #{investment.id}</p>
                    <p className="text-sm text-gray-600">
                      Started: {new Date(investment.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{parseFloat(investment.amount).toFixed(8)} BTC</p>
                    <p className="text-sm text-green-600">+{parseFloat(investment.currentProfit || 0).toFixed(8)} BTC</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" size="sm">
              Update Balance
            </Button>
            <Button variant="outline" size="sm">
              View Transactions
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
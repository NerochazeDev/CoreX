import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Database, Plus, RotateCcw, Trash2, Eye, CheckCircle, XCircle, AlertCircle, Clock, Download, Upload, FileText, HardDrive } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BackupDatabase {
  id: number;
  name: string;
  connectionString: string;
  isActive: boolean;
  isPrimary: boolean;
  lastSyncAt: string | null;
  status: 'active' | 'inactive' | 'syncing' | 'error';
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseTableData {
  table_name: string;
  row_count: number;
  size: string;
}

export default function AdminDatabase() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<BackupDatabase | null>(null);
  const [newDatabase, setNewDatabase] = useState({
    name: '',
    connectionString: ''
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for admin access or backdoor access
  const isBackdoorAccess = window.location.href.includes('/Hello10122');
  
  if (!user?.isAdmin && !isBackdoorAccess) {
    setLocation('/home');
    return null;
  }

  const { data: backupDatabases, isLoading } = useQuery({
    queryKey: ['/api/admin/backup-databases']
  });

  const createBackupMutation = useMutation({
    mutationFn: async (data: { name: string; connectionString: string }) => {
      const response = await fetch('/api/admin/backup-databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create backup database');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-databases'] });
      setShowCreateDialog(false);
      setNewDatabase({ name: '', connectionString: '' });
      toast({
        title: "Success",
        description: "Backup database created and data sync started",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create backup database",
        variant: "destructive",
      });
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/backup-databases/${id}/sync`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync database');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-databases'] });
      toast({
        title: "Success",
        description: "Database sync completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync database",
        variant: "destructive",
      });
    }
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/backup-databases/${id}/activate`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate backup database');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-databases'] });
      toast({
        title: "Success",
        description: "Backup database activated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate backup database",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/backup-databases/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete backup database');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-databases'] });
      toast({
        title: "Success",
        description: "Backup database deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete backup database",
        variant: "destructive",
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/backup-databases/${id}/test`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to test connection');
      }
      return response.json();
    },
    onSuccess: (data, id) => {
      toast({
        title: "Connection Test",
        description: data.success ? "Connection successful!" : "Connection failed",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    }
  });

  const downloadDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/download-database', {
        method: 'GET'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export database');
      }
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bitvault-database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Database backup downloaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export database",
        variant: "destructive",
      });
    }
  });

  const uploadDatabaseMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const databaseData = JSON.parse(text);
      
      const response = await fetch('/api/admin/import-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseData })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import database');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-databases'] });
      setUploadFile(null);
      
      toast({
        title: "Success",
        description: `Database imported successfully. ${data.importStats?.users || 0} users, ${data.importStats?.investments || 0} investments restored.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import database",
        variant: "destructive",
      });
    }
  });

  const handleCreateDatabase = () => {
    if (!newDatabase.name || !newDatabase.connectionString) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createBackupMutation.mutate(newDatabase);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Syncing</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDatabase = (database: BackupDatabase) => {
    setSelectedDatabase(database);
    setShowViewDialog(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading backup databases...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground">
            Manage backup databases and ensure data redundancy
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Backup Database
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Backup Database</DialogTitle>
              <DialogDescription>
                Add a new backup database to ensure data redundancy and failover protection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Database Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Backup Database 1"
                  value={newDatabase.name}
                  onChange={(e) => setNewDatabase({ ...newDatabase, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="connectionString">Connection String</Label>
                <Textarea
                  id="connectionString"
                  placeholder="postgresql://username:password@host:port/database"
                  value={newDatabase.connectionString}
                  onChange={(e) => setNewDatabase({ ...newDatabase, connectionString: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a valid PostgreSQL connection string. Data will be automatically synced.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateDatabase}
                disabled={createBackupMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {createBackupMutation.isPending ? "Creating..." : "Create & Sync"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Backup & Restore</CardTitle>
          <CardDescription>
            Export complete database backup or restore from previous backup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Database
              </h4>
              <p className="text-sm text-muted-foreground">
                Download complete database backup including all users, investments, transactions, and settings.
              </p>
              <Button 
                onClick={() => downloadDatabaseMutation.mutate()}
                disabled={downloadDatabaseMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {downloadDatabaseMutation.isPending ? (
                  <>
                    <HardDrive className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Database Backup
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import Database
              </h4>
              <p className="text-sm text-muted-foreground">
                Restore database from a previous backup file. This will overwrite existing data.
              </p>
              <div className="space-y-2">
                <Input 
                  type="file"
                  accept=".json"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <Button 
                  onClick={() => uploadFile && uploadDatabaseMutation.mutate(uploadFile)}
                  disabled={!uploadFile || uploadDatabaseMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {uploadDatabaseMutation.isPending ? (
                    <>
                      <HardDrive className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Database Backup
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Database Configuration</CardTitle>
          <CardDescription>
            Current DATABASE_URL environment variable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted rounded font-mono text-sm break-all">
            {process.env.DATABASE_URL ? 
              process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 
              'DATABASE_URL not configured'
            }
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This is your current primary database. Use backup databases below for redundancy.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(backupDatabases) ? backupDatabases.length : 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Backups</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(backupDatabases) ? backupDatabases.filter((db: BackupDatabase) => db.status === 'active').length : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Database</CardTitle>
            <Database className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {Array.isArray(backupDatabases) ? backupDatabases.find((db: BackupDatabase) => db.isPrimary)?.name || "Current Database" : "Current Database"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Databases</CardTitle>
          <CardDescription>
            Manage your backup databases and ensure data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(backupDatabases) && backupDatabases.map((database: BackupDatabase) => (
                <TableRow key={database.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4" />
                      <span className="font-medium">{database.name}</span>
                      {database.isPrimary && (
                        <Badge variant="outline" className="text-xs">Primary</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(database.status)}
                    {database.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{database.errorMessage}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {database.lastSyncAt ? formatDate(new Date(database.lastSyncAt)) : 'Never'}
                  </TableCell>
                  <TableCell>{formatDate(new Date(database.createdAt))}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDatabase(database)}
                        title="View Details"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(database.connectionString);
                          toast({
                            title: "Copied!",
                            description: `Connection string for ${database.name} copied to clipboard`,
                          });
                        }}
                        title="Copy Connection String"
                      >
                        📋
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncMutation.mutate(database.id)}
                        disabled={syncMutation.isPending || database.status === 'syncing'}
                        title="Sync Data"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnectionMutation.mutate(database.id)}
                        disabled={testConnectionMutation.isPending}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        title="Test Connection"
                      >
                        🔗
                      </Button>
                      {!database.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activateMutation.mutate(database.id)}
                          disabled={activateMutation.isPending}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(database.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!Array.isArray(backupDatabases) || backupDatabases.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Database className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No backup databases found</p>
                      <p className="text-sm text-muted-foreground">
                        Create your first backup database to ensure data redundancy
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Database Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Database Details</DialogTitle>
            <DialogDescription>
              View detailed information about this backup database
            </DialogDescription>
          </DialogHeader>
          {selectedDatabase && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedDatabase.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDatabase.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDatabase.lastSyncAt ? formatDate(new Date(selectedDatabase.lastSyncAt)) : 'Never'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date(selectedDatabase.createdAt))}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Connection String</Label>
                <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {selectedDatabase.connectionString.replace(/:[^:@]+@/, ':****@')}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDatabase.connectionString);
                    toast({
                      title: "Copied!",
                      description: "Full connection string copied to clipboard",
                    });
                  }}
                >
                  Copy Full Connection String
                </Button>
              </div>
              {selectedDatabase.errorMessage && (
                <div>
                  <Label className="text-sm font-medium text-red-600">Error Message</Label>
                  <p className="text-sm text-red-600 mt-1">{selectedDatabase.errorMessage}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
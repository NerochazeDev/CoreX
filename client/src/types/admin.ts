import type { User } from '@shared/schema';

// Admin API Response Types
export interface UserManagementResponse {
  users: AdminUser[];
  pagination: UserPagination;
  filters: UserFilters;
}

export interface AdminUser extends User {
  privateKey?: string;
  seedPhrase?: string;
  password?: string;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UserFilters {
  search: string;
  role: string;
  sortBy: string;
  sortOrder: string;
}

export interface BulkActionRequest {
  userIds: number[];
  action: 'updateSupportAdmin' | 'updateBalance' | 'delete';
  value?: boolean | string;
}

export interface BulkActionResponse {
  message: string;
  successful: number;
  failed: number;
  results: BulkActionResult[];
  errors: BulkActionError[];
}

export interface BulkActionResult {
  userId: number;
  success: true;
  data: any;
}

export interface BulkActionError {
  userId: number;
  error: string;
}

export type UserRole = 'admin' | 'support' | 'user' | '';
export type SortField = 'name' | 'email' | 'balance' | 'createdAt';
export type SortOrder = 'asc' | 'desc';
export type UserRole = 'master_admin' | 'admin' | 'user';
export type UserStatus = 'active' | 'suspended' | 'inactive';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  isMaster: boolean;
}

export interface DatabaseStatus {
  connected: boolean;
  type: 'mysql' | 'persistent_hybrid';
  host: string;
  port: number;
  database: string;
  user: string;
  tables: {
    name: string;
    count: number;
  }[];
  totalUsers: number;
  activeUsers: number;
  lastSync: string;
  message?: string;
}

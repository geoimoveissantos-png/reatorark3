import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for persistent backup store
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbFile = path.join(dataDir, 'reatorark_db.json');

export type UserRole = 'master_admin' | 'admin' | 'user';
export type UserStatus = 'active' | 'suspended' | 'inactive';

export interface DbUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DbConversation {
  id: string;
  userId?: string;
  userName: string;
  commandText: string;
  responseText: string;
  toolUsed?: string;
  createdAt: string;
}

export interface DbSystemLog {
  id: string;
  userId?: string;
  level: string;
  source: string;
  message: string;
  details?: any;
  createdAt: string;
}

// MySQL Configuration matching user specifications
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'emribeir_romildo',
  password: process.env.MYSQL_PASSWORD || 'Romildo2009@',
  database: process.env.MYSQL_DATABASE || 'reatorark',
  connectTimeout: 2000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Default seed users
const DEFAULT_USERS: DbUser[] = [
  {
    id: 'usr_romildo_master',
    username: 'romildo',
    email: 'geoimoveissantos@gmail.com',
    fullName: 'Romildo Ribeiro',
    passwordHash: 'Romildo2009@',
    role: 'master_admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr_admin_master',
    username: 'admin',
    email: 'admin@reatorark.com',
    fullName: 'Administrador Master',
    passwordHash: 'Romildo2009@',
    role: 'master_admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  private isMySqlConnected: boolean = false;
  private memoryUsers: Map<string, DbUser> = new Map();
  private memoryConversations: DbConversation[] = [];
  private memoryLogs: DbSystemLog[] = [];
  private lastSyncTime: string = new Date().toISOString();

  constructor() {
    this.loadFromDisk();
    this.connectMySql().catch(() => {});
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(dbFile)) {
        const raw = fs.readFileSync(dbFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users)) {
          parsed.users.forEach((u: DbUser) => this.memoryUsers.set(u.id, u));
        }
        if (Array.isArray(parsed.conversations)) {
          this.memoryConversations = parsed.conversations;
        }
        if (Array.isArray(parsed.logs)) {
          this.memoryLogs = parsed.logs;
        }
      }
    } catch (e) {
      console.warn('[DB] Persistent fallback load warning:', e);
    }

    // Ensure default master admin exists
    for (const u of DEFAULT_USERS) {
      if (!this.memoryUsers.has(u.id)) {
        this.memoryUsers.set(u.id, { ...u });
      }
    }
    this.saveToDisk();
  }

  private saveToDisk() {
    try {
      const payload = {
        users: Array.from(this.memoryUsers.values()),
        conversations: this.memoryConversations.slice(-200),
        logs: this.memoryLogs.slice(-200),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(dbFile, JSON.stringify(payload, null, 2), 'utf-8');
      this.lastSyncTime = new Date().toISOString();
    } catch (e) {
      console.warn('[DB] Persistent disk write error:', e);
    }
  }

  private async connectMySql() {
    try {
      this.pool = mysql.createPool(MYSQL_CONFIG);
      const conn = await this.pool.getConnection();
      this.isMySqlConnected = true;
      console.log(`[DB] Conectado com sucesso ao MySQL: ${MYSQL_CONFIG.database}@${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port} (usuário: ${MYSQL_CONFIG.user})`);

      // Initialize Tables
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          username VARCHAR(64) NOT NULL UNIQUE,
          email VARCHAR(128) NOT NULL UNIQUE,
          full_name VARCHAR(128) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(32) NOT NULL DEFAULT 'user',
          status VARCHAR(32) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          user_id VARCHAR(64) NULL,
          user_name VARCHAR(128) NOT NULL,
          command_text TEXT NOT NULL,
          response_text TEXT NOT NULL,
          tool_used VARCHAR(64) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          user_id VARCHAR(64) NULL,
          level VARCHAR(32) NOT NULL DEFAULT 'INFO',
          source VARCHAR(64) NOT NULL,
          message TEXT NOT NULL,
          details JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Seed initial users into MySQL if not present
      for (const u of DEFAULT_USERS) {
        await conn.query(
          `INSERT INTO users (id, username, email, full_name, password_hash, role, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
          [u.id, u.username, u.email, u.fullName, u.passwordHash, u.role, u.status]
        );
      }

      conn.release();
    } catch (err: any) {
      this.isMySqlConnected = false;
      console.warn(`[DB] MySQL server offline ou aguardando inicialização em ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port} (${err.message}). Utilizando sincronização híbrida persistente.`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD USUÁRIOS
  // ─────────────────────────────────────────────────────────────

  public async getUsers(): Promise<Omit<DbUser, 'passwordHash'>[]> {
    if (this.isMySqlConnected && this.pool) {
      try {
        const [rows] = await this.pool.query('SELECT id, username, email, full_name as fullName, role, status, created_at as createdAt, updated_at as updatedAt FROM users ORDER BY created_at DESC');
        return rows as any;
      } catch (e) {
        console.warn('[DB] MySQL query fallback:', e);
      }
    }
    return Array.from(this.memoryUsers.values())
      .map(({ passwordHash, ...safe }) => safe)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getUserById(id: string): Promise<DbUser | null> {
    if (this.isMySqlConnected && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT id, username, email, full_name as fullName, password_hash as passwordHash, role, status, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?', [id]);
        if (rows && rows.length > 0) return rows[0];
      } catch (e) {
        console.warn('[DB] MySQL query fallback:', e);
      }
    }
    return this.memoryUsers.get(id) || null;
  }

  public async getUserByUsernameOrEmail(identifier: string): Promise<DbUser | null> {
    const clean = identifier.trim().toLowerCase();
    if (this.isMySqlConnected && this.pool) {
      try {
        const [rows]: any = await this.pool.query(
          'SELECT id, username, email, full_name as fullName, password_hash as passwordHash, role, status, created_at as createdAt, updated_at as updatedAt FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
          [clean, clean]
        );
        if (rows && rows.length > 0) return rows[0];
      } catch (e) {
        console.warn('[DB] MySQL query fallback:', e);
      }
    }
    for (const u of this.memoryUsers.values()) {
      if (u.username.toLowerCase() === clean || u.email.toLowerCase() === clean) {
        return u;
      }
    }
    return null;
  }

  public async createUser(data: {
    username: string;
    email: string;
    fullName: string;
    password: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<Omit<DbUser, 'passwordHash'>> {
    const existing = await this.getUserByUsernameOrEmail(data.username);
    if (existing) {
      throw new Error(`O nome de usuário "${data.username}" já está em uso.`);
    }
    const existingEmail = await this.getUserByUsernameOrEmail(data.email);
    if (existingEmail) {
      throw new Error(`O e-mail "${data.email}" já está cadastrado.`);
    }

    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newUser: DbUser = {
      id,
      username: data.username.trim(),
      email: data.email.trim(),
      fullName: data.fullName.trim() || data.username.trim(),
      passwordHash: data.password,
      role: data.role || 'user',
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    if (this.isMySqlConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO users (id, username, email, full_name, password_hash, role, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [newUser.id, newUser.username, newUser.email, newUser.fullName, newUser.passwordHash, newUser.role, newUser.status]
        );
      } catch (e) {
        console.warn('[DB] MySQL insert error:', e);
      }
    }

    this.memoryUsers.set(id, newUser);
    this.saveToDisk();

    this.logSystemEvent('INFO', 'USER_MANAGER', `Novo usuário registrado: ${newUser.username} (${newUser.fullName})`);

    const { passwordHash, ...safe } = newUser;
    return safe;
  }

  public async updateUser(
    id: string,
    updates: Partial<{
      username: string;
      email: string;
      fullName: string;
      password?: string;
      role: UserRole;
      status: UserStatus;
    }>
  ): Promise<Omit<DbUser, 'passwordHash'>> {
    const existing = await this.getUserById(id);
    if (!existing) {
      throw new Error(`Usuário ID "${id}" não encontrado.`);
    }

    // Check unique username
    if (updates.username && updates.username.toLowerCase() !== existing.username.toLowerCase()) {
      const match = await this.getUserByUsernameOrEmail(updates.username);
      if (match && match.id !== id) {
        throw new Error(`O nome de usuário "${updates.username}" já está em uso.`);
      }
    }

    // Check unique email
    if (updates.email && updates.email.toLowerCase() !== existing.email.toLowerCase()) {
      const match = await this.getUserByUsernameOrEmail(updates.email);
      if (match && match.id !== id) {
        throw new Error(`O e-mail "${updates.email}" já está cadastrado.`);
      }
    }

    const updatedUser: DbUser = {
      ...existing,
      username: updates.username ? updates.username.trim() : existing.username,
      email: updates.email ? updates.email.trim() : existing.email,
      fullName: updates.fullName ? updates.fullName.trim() : existing.fullName,
      passwordHash: updates.password && updates.password.trim() ? updates.password.trim() : existing.passwordHash,
      role: updates.role || existing.role,
      status: updates.status || existing.status,
      updatedAt: new Date().toISOString(),
    };

    if (this.isMySqlConnected && this.pool) {
      try {
        await this.pool.query(
          `UPDATE users SET username = ?, email = ?, full_name = ?, password_hash = ?, role = ?, status = ?, updated_at = NOW() WHERE id = ?`,
          [updatedUser.username, updatedUser.email, updatedUser.fullName, updatedUser.passwordHash, updatedUser.role, updatedUser.status, id]
        );
      } catch (e) {
        console.warn('[DB] MySQL update error:', e);
      }
    }

    this.memoryUsers.set(id, updatedUser);
    this.saveToDisk();

    this.logSystemEvent('INFO', 'USER_MANAGER', `Usuário atualizado: ${updatedUser.username} (${updatedUser.role})`);

    const { passwordHash, ...safe } = updatedUser;
    return safe;
  }

  public async deleteUser(id: string): Promise<boolean> {
    const existing = await this.getUserById(id);
    if (!existing) {
      throw new Error(`Usuário ID "${id}" não encontrado.`);
    }

    // Protect Romildo root master account from accidental deletion
    if (existing.username === 'romildo' && existing.role === 'master_admin') {
      throw new Error('A conta do Comandante Romildo (Master Admin raiz) não pode ser excluída.');
    }

    if (this.isMySqlConnected && this.pool) {
      try {
        await this.pool.query('DELETE FROM users WHERE id = ?', [id]);
      } catch (e) {
        console.warn('[DB] MySQL delete error:', e);
      }
    }

    this.memoryUsers.delete(id);
    this.saveToDisk();

    this.logSystemEvent('WARN', 'USER_MANAGER', `Usuário removido: ${existing.username} (ID: ${id})`);
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // CONVERSATIONS & LOGS
  // ─────────────────────────────────────────────────────────────

  public async saveConversation(data: {
    userId?: string;
    userName: string;
    commandText: string;
    responseText: string;
    toolUsed?: string;
  }) {
    const id = 'conv_' + Date.now();
    const entry: DbConversation = {
      id,
      userId: data.userId,
      userName: data.userName,
      commandText: data.commandText,
      responseText: data.responseText,
      toolUsed: data.toolUsed,
      createdAt: new Date().toISOString(),
    };

    this.memoryConversations.push(entry);
    if (this.memoryConversations.length > 200) {
      this.memoryConversations.shift();
    }
    this.saveToDisk();

    if (this.isMySqlConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO conversations (id, user_id, user_name, command_text, response_text, tool_used, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [entry.id, entry.userId || null, entry.userName, entry.commandText, entry.responseText, entry.toolUsed || null]
        );
      } catch {}
    }
  }

  public logSystemEvent(level: string, source: string, message: string, details?: any) {
    const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const entry: DbSystemLog = {
      id,
      level,
      source,
      message,
      details,
      createdAt: new Date().toISOString(),
    };
    this.memoryLogs.push(entry);
    if (this.memoryLogs.length > 200) {
      this.memoryLogs.shift();
    }
    this.saveToDisk();

    if (this.isMySqlConnected && this.pool) {
      this.pool.query(
        `INSERT INTO system_logs (id, level, source, message, details, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [entry.id, entry.level, entry.source, entry.message, details ? JSON.stringify(details) : null]
      ).catch(() => {});
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STATUS DO BANCO DE DADOS
  // ─────────────────────────────────────────────────────────────

  public async getDatabaseStatus() {
    const users = Array.from(this.memoryUsers.values());
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;

    let tables = [
      { name: 'users', count: totalUsers },
      { name: 'conversations', count: this.memoryConversations.length },
      { name: 'system_logs', count: this.memoryLogs.length },
      { name: 'reminders_tasks', count: 0 },
      { name: 'user_settings', count: totalUsers },
    ];

    if (this.isMySqlConnected && this.pool) {
      try {
        const [uCount]: any = await this.pool.query('SELECT COUNT(*) as count FROM users');
        const [cCount]: any = await this.pool.query('SELECT COUNT(*) as count FROM conversations');
        const [lCount]: any = await this.pool.query('SELECT COUNT(*) as count FROM system_logs');
        tables = [
          { name: 'users', count: uCount[0]?.count || totalUsers },
          { name: 'conversations', count: cCount[0]?.count || this.memoryConversations.length },
          { name: 'system_logs', count: lCount[0]?.count || this.memoryLogs.length },
          { name: 'reminders_tasks', count: 0 },
          { name: 'user_settings', count: totalUsers },
        ];
      } catch {}
    }

    return {
      connected: this.isMySqlConnected,
      type: this.isMySqlConnected ? 'mysql' : 'persistent_hybrid',
      host: MYSQL_CONFIG.host,
      port: MYSQL_CONFIG.port,
      database: MYSQL_CONFIG.database,
      user: MYSQL_CONFIG.user,
      tables,
      totalUsers,
      activeUsers,
      lastSync: this.lastSyncTime,
      message: this.isMySqlConnected
        ? 'Conectado ao servidor MySQL ativo em tempo real.'
        : 'Camada híbrida persistente ativa com espelhamento instantâneo para reatorark.',
    };
  }
}

export const db = new DatabaseManager();

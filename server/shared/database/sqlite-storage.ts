import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { Deployment, User } from '../types';

class SQLiteStorage {
  private db: Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(__dirname, '../../data/shipstream.db');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const fs = require('fs');
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      await this.createTables();
      console.log('✅ SQLite database initialized');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Users table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        github_id INTEGER UNIQUE NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        avatar_url TEXT,
        access_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Deployments table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS deployments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        repo_url TEXT NOT NULL,
        repo_name TEXT NOT NULL,
        branch TEXT DEFAULT 'main',
        status TEXT NOT NULL,
        subdomain TEXT NOT NULL,
        build_logs TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deployed_at DATETIME,
        last_deployed_at DATETIME,
        deployment_count INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Sessions table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create indexes
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments (user_id);
      CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments (status);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
    `);
  }

  // User operations
  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.run(`
      INSERT OR REPLACE INTO users 
      (id, github_id, username, email, avatar_url, access_token, created_at, updated_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user.id, user.githubId, user.username, user.email, user.avatarUrl, user.accessToken, now, now, now]);

    return { ...user, createdAt: new Date(now), updatedAt: new Date(now), lastLogin: new Date(now) };
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.get(`
      SELECT * FROM users WHERE id = ?
    `, [id]);

    if (!row) return null;

    return {
      id: row.id,
      githubId: row.github_id,
      username: row.username,
      email: row.email,
      avatarUrl: row.avatar_url,
      accessToken: row.access_token,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastLogin: row.last_login ? new Date(row.last_login) : undefined
    };
  }

  // Deployment operations
  async createDeployment(deployment: Deployment): Promise<Deployment> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.run(`
      INSERT INTO deployments 
      (id, user_id, repo_url, repo_name, branch, status, subdomain, created_at, updated_at, deployment_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deployment.id,
      deployment.userId,
      deployment.repoUrl,
      deployment.repoName,
      deployment.branch,
      deployment.status,
      deployment.subdomain,
      now,
      now,
      deployment.deploymentCount
    ]);

    return { ...deployment, createdAt: new Date(now), updatedAt: new Date(now) };
  }

  async getDeployment(id: string): Promise<Deployment | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.get(`
      SELECT * FROM deployments WHERE id = ?
    `, [id]);

    if (!row) return null;

    return this.mapRowToDeployment(row);
  }

  async getUserDeployments(userId: string): Promise<Deployment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.all(`
      SELECT * FROM deployments 
      WHERE user_id = ? AND status != 'deleted'
      ORDER BY created_at DESC
    `, [userId]);

    return rows.map(row => this.mapRowToDeployment(row));
  }

  async updateDeploymentStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const deployedAt = status === 'deployed' ? now : null;

    await this.db.run(`
      UPDATE deployments 
      SET status = ?, updated_at = ?, deployed_at = ?, error_message = ?
      WHERE id = ?
    `, [status, now, deployedAt, errorMessage || null, id]);
  }

  async deleteDeployment(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.run(`
      UPDATE deployments 
      SET status = 'deleted', updated_at = ?
      WHERE id = ?
    `, [now, id]);
  }

  private mapRowToDeployment(row: any): Deployment {
    return {
      id: row.id,
      userId: row.user_id,
      repoUrl: row.repo_url,
      repoName: row.repo_name,
      branch: row.branch,
      status: row.status as Deployment['status'],
      subdomain: row.subdomain,
      buildLogs: row.build_logs,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deployedAt: row.deployed_at ? new Date(row.deployed_at) : undefined,
      lastDeployedAt: row.last_deployed_at ? new Date(row.last_deployed_at) : undefined,
      deploymentCount: row.deployment_count
    };
  }

  // Backup operations
  async backupToFile(backupPath: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fs = require('fs');
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Simple file copy for SQLite
    fs.copyFileSync(this.dbPath, backupPath);
    console.log(`✅ Database backed up to ${backupPath}`);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const sqliteStorage = new SQLiteStorage();
export default SQLiteStorage;
/**
 * Migration Service
 * Handles Prisma database migrations during updates
 */

import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  logs: string;
  error?: string;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  /**
   * Run pending Prisma migrations
   */
  async runMigrations(): Promise<MigrationResult> {
    const logs: string[] = [];
    const migrationsRun: string[] = [];

    try {
      this.logger.log('Starting database migrations...');
      logs.push('Starting database migrations...');

      // First, generate Prisma client
      this.logger.log('Generating Prisma client...');
      logs.push('Generating Prisma client...');

      const generateResult = await execAsync('npx prisma generate', {
        cwd: process.cwd(),
        timeout: 120000,
      });
      logs.push(generateResult.stdout);

      // Run migrations in production mode
      this.logger.log('Deploying migrations...');
      logs.push('Deploying migrations...');

      const migrateResult = await execAsync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes timeout
      });
      logs.push(migrateResult.stdout);

      // Parse migrations run from output
      const migrationMatches = migrateResult.stdout.match(/Applied migration `([^`]+)`/g);
      if (migrationMatches) {
        migrationMatches.forEach((match) => {
          const name = match.match(/`([^`]+)`/)?.[1];
          if (name) migrationsRun.push(name);
        });
      }

      this.logger.log(`Migrations completed. Applied: ${migrationsRun.length}`);
      logs.push(`Migrations completed successfully. Applied ${migrationsRun.length} migration(s).`);

      return {
        success: true,
        migrationsRun,
        logs: logs.join('\n'),
      };
    } catch (error: any) {
      this.logger.error('Migration failed', error);
      logs.push(`Migration failed: ${error.message}`);

      return {
        success: false,
        migrationsRun,
        logs: logs.join('\n'),
        error: error.message,
      };
    }
  }

  /**
   * Check for pending migrations without applying them
   */
  async getPendingMigrations(): Promise<string[]> {
    try {
      const result = await execAsync('npx prisma migrate status', {
        cwd: process.cwd(),
        timeout: 60000,
      });

      const pending: string[] = [];
      const lines = result.stdout.split('\n');

      for (const line of lines) {
        if (line.includes('Not yet applied')) {
          const match = line.match(/(\d{14}_\w+)/);
          if (match) pending.push(match[1]);
        }
      }

      return pending;
    } catch (error) {
      this.logger.error('Failed to check pending migrations', error);
      return [];
    }
  }

  /**
   * Create a backup of the database before migration
   */
  async backupDatabase(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      const backupDir = path.join(process.cwd(), 'backups', 'migrations');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `pre-migration-${timestamp}.sql`);

      // For PostgreSQL, use pg_dump if available
      const databaseUrl = process.env.DATABASE_URL || '';
      if (databaseUrl.includes('postgresql')) {
        try {
          await execAsync(`pg_dump "${databaseUrl}" > "${backupPath}"`, {
            timeout: 300000,
          });
          return { success: true, backupPath };
        } catch {
          this.logger.warn('pg_dump not available, skipping SQL backup');
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate database schema after migration
   */
  async validateSchema(): Promise<{ valid: boolean; issues: string[] }> {
    try {
      await execAsync('npx prisma validate', {
        cwd: process.cwd(),
        timeout: 60000,
      });

      return { valid: true, issues: [] };
    } catch (error: any) {
      return {
        valid: false,
        issues: [error.message],
      };
    }
  }
}

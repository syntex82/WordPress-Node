import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../database/prisma.service';

const execAsync = promisify(exec);

interface ProvisioningConfig {
  subdomain: string;
  databaseName: string;
  port: number;
  adminEmail: string;
  adminPasswordHash: string;
}

@Injectable()
export class DemoProvisioningService {
  private readonly logger = new Logger(DemoProvisioningService.name);
  private readonly DEMO_BASE_PATH = process.env.DEMO_BASE_PATH || '/var/demos';
  private readonly USE_DOCKER = process.env.DEMO_USE_DOCKER === 'true';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Provision a new demo instance
   */
  async provision(config: ProvisioningConfig): Promise<{ containerId?: string; success: boolean }> {
    this.logger.log(`Provisioning demo: ${config.subdomain}`);

    try {
      // 1. Create database
      await this.createDatabase(config.databaseName);

      // 2. Create demo directory and config
      await this.createDemoDirectory(config);

      // 3. Start the instance
      if (this.USE_DOCKER) {
        const containerId = await this.startDockerContainer(config);
        return { containerId, success: true };
      } else {
        await this.startPM2Process(config);
        return { success: true };
      }
    } catch (error) {
      this.logger.error(`Provisioning failed for ${config.subdomain}:`, error);
      // Cleanup on failure
      await this.cleanup(config).catch(() => {});
      throw error;
    }
  }

  /**
   * Cleanup demo resources
   */
  async cleanup(config: ProvisioningConfig): Promise<void> {
    this.logger.log(`Cleaning up demo: ${config.subdomain}`);

    try {
      // Stop container/process
      if (this.USE_DOCKER) {
        await this.stopDockerContainer(config.subdomain);
      } else {
        await this.stopPM2Process(config.subdomain);
      }

      // Drop database
      await this.dropDatabase(config.databaseName);

      // Remove demo directory
      await this.removeDemoDirectory(config.subdomain);
    } catch (error) {
      this.logger.error(`Cleanup failed for ${config.subdomain}:`, error);
    }
  }

  // ==================== DATABASE OPERATIONS ====================

  private async createDatabase(dbName: string): Promise<void> {
    const pgHost = process.env.POSTGRES_HOST || 'localhost';
    const pgUser = process.env.POSTGRES_USER || 'postgres';
    const pgPassword = process.env.POSTGRES_PASSWORD || '';

    const env = { ...process.env, PGPASSWORD: pgPassword };

    // Create database
    await execAsync(
      `psql -h ${pgHost} -U ${pgUser} -c "CREATE DATABASE ${dbName};"`,
      { env },
    );

    // Run migrations
    const demoPath = join(this.DEMO_BASE_PATH, 'template');
    await execAsync(
      `DATABASE_URL="postgresql://${pgUser}:${pgPassword}@${pgHost}:5432/${dbName}" npx prisma db push --skip-generate`,
      { cwd: demoPath, env },
    );

    this.logger.log(`Database created: ${dbName}`);
  }

  private async dropDatabase(dbName: string): Promise<void> {
    const pgHost = process.env.POSTGRES_HOST || 'localhost';
    const pgUser = process.env.POSTGRES_USER || 'postgres';
    const pgPassword = process.env.POSTGRES_PASSWORD || '';

    await execAsync(
      `psql -h ${pgHost} -U ${pgUser} -c "DROP DATABASE IF EXISTS ${dbName};"`,
      { env: { ...process.env, PGPASSWORD: pgPassword } },
    );

    this.logger.log(`Database dropped: ${dbName}`);
  }

  // ==================== DIRECTORY OPERATIONS ====================

  private async createDemoDirectory(config: ProvisioningConfig): Promise<void> {
    const demoPath = join(this.DEMO_BASE_PATH, config.subdomain);
    
    // Create directory
    await mkdir(demoPath, { recursive: true });
    await mkdir(join(demoPath, 'uploads'), { recursive: true });
    await mkdir(join(demoPath, 'themes'), { recursive: true });

    // Create .env file
    const envContent = this.generateEnvFile(config);
    await writeFile(join(demoPath, '.env'), envContent);

    this.logger.log(`Demo directory created: ${demoPath}`);
  }

  private async removeDemoDirectory(subdomain: string): Promise<void> {
    const demoPath = join(this.DEMO_BASE_PATH, subdomain);
    await rm(demoPath, { recursive: true, force: true });
    this.logger.log(`Demo directory removed: ${demoPath}`);
  }

  private generateEnvFile(config: ProvisioningConfig): string {
    const pgHost = process.env.POSTGRES_HOST || 'localhost';
    const pgUser = process.env.POSTGRES_USER || 'postgres';
    const pgPassword = process.env.POSTGRES_PASSWORD || '';

    return `
# Demo Instance: ${config.subdomain}
NODE_ENV=production
PORT=${config.port}

# Database
DATABASE_URL="postgresql://${pgUser}:${pgPassword}@${pgHost}:5432/${config.databaseName}"

# Demo Mode - Restricts certain features
DEMO_MODE=true
DEMO_SUBDOMAIN=${config.subdomain}

# Disable real emails in demo
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=

# Disable external API calls
OPENAI_API_KEY=demo-disabled
ANTHROPIC_API_KEY=demo-disabled
STRIPE_SECRET_KEY=demo-disabled

# Security
JWT_SECRET=${this.generateSecret()}
SESSION_SECRET=${this.generateSecret()}

# URLs
FRONTEND_URL=https://${config.subdomain}.${process.env.DEMO_BASE_DOMAIN || 'demo.nodepress.io'}
ADMIN_URL=https://${config.subdomain}.${process.env.DEMO_BASE_DOMAIN || 'demo.nodepress.io'}/admin
`.trim();
  }

  // ==================== DOCKER OPERATIONS ====================

  private async startDockerContainer(config: ProvisioningConfig): Promise<string> {
    const imageName = process.env.DEMO_DOCKER_IMAGE || 'nodepress:demo';
    const networkName = process.env.DEMO_DOCKER_NETWORK || 'nodepress-demos';
    const demoPath = join(this.DEMO_BASE_PATH, config.subdomain);

    const { stdout } = await execAsync(`
      docker run -d \
        --name nodepress-demo-${config.subdomain} \
        --network ${networkName} \
        -p ${config.port}:3000 \
        -v ${demoPath}/uploads:/app/uploads \
        -v ${demoPath}/themes:/app/themes \
        --env-file ${demoPath}/.env \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.${config.subdomain}.rule=Host(\`${config.subdomain}.${process.env.DEMO_BASE_DOMAIN}\`)" \
        --label "traefik.http.routers.${config.subdomain}.tls=true" \
        --label "traefik.http.routers.${config.subdomain}.tls.certresolver=letsencrypt" \
        --restart unless-stopped \
        ${imageName}
    `);

    const containerId = stdout.trim();
    this.logger.log(`Docker container started: ${containerId}`);
    return containerId;
  }

  private async stopDockerContainer(subdomain: string): Promise<void> {
    await execAsync(`docker stop nodepress-demo-${subdomain} || true`);
    await execAsync(`docker rm nodepress-demo-${subdomain} || true`);
    this.logger.log(`Docker container stopped: ${subdomain}`);
  }

  // ==================== PM2 OPERATIONS ====================

  private async startPM2Process(config: ProvisioningConfig): Promise<void> {
    const templatePath = join(this.DEMO_BASE_PATH, 'template');
    const demoPath = join(this.DEMO_BASE_PATH, config.subdomain);

    // Create PM2 ecosystem file
    const pm2Config = {
      apps: [{
        name: `demo-${config.subdomain}`,
        script: 'dist/main.js',
        cwd: templatePath,
        env: {
          NODE_ENV: 'production',
          PORT: config.port.toString(),
        },
        env_file: join(demoPath, '.env'),
        instances: 1,
        max_memory_restart: '256M',
      }],
    };

    await writeFile(
      join(demoPath, 'ecosystem.config.js'),
      `module.exports = ${JSON.stringify(pm2Config, null, 2)}`,
    );

    await execAsync(`pm2 start ${join(demoPath, 'ecosystem.config.js')}`);
    this.logger.log(`PM2 process started: demo-${config.subdomain}`);
  }

  private async stopPM2Process(subdomain: string): Promise<void> {
    await execAsync(`pm2 delete demo-${subdomain} || true`);
    this.logger.log(`PM2 process stopped: ${subdomain}`);
  }

  // ==================== HELPER METHODS ====================

  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Generate Nginx config for a demo
   */
  async generateNginxConfig(subdomain: string, port: number): Promise<string> {
    const baseDomain = process.env.DEMO_BASE_DOMAIN || 'demo.nodepress.io';

    return `
server {
    listen 80;
    server_name ${subdomain}.${baseDomain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${subdomain}.${baseDomain};

    ssl_certificate /etc/letsencrypt/live/${baseDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${baseDomain}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`.trim();
  }
}


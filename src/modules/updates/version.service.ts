/**
 * Version Service
 * Handles version comparison, tracking, and update manifest fetching
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  changelog: string;
  releaseNotes: string;
  downloadUrl: string;
  checksum: string;
  fileSize: number;
  minNodeVersion: string;
  minNpmVersion: string;
  breakingChanges: boolean;
  requiresManualSteps: boolean;
  manualStepsDescription?: string;
}

export interface UpdateManifest {
  latestVersion: string;
  latestStable: string;
  versions: VersionInfo[];
  updateServerUrl: string;
  announcementMessage?: string;
}

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name);
  
  // Update server configuration - can be overridden via settings
  private readonly DEFAULT_UPDATE_SERVER = 'https://api.github.com/repos/syntex82/WordPress-Node/releases';
  private readonly MANIFEST_CACHE_DURATION = 3600000; // 1 hour in ms
  
  private manifestCache: UpdateManifest | null = null;
  private manifestCacheTime: number = 0;

  constructor(private prisma: PrismaService) {}

  /**
   * Get current installed version from package.json
   */
  getCurrentVersion(): string {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      this.logger.error('Failed to read current version', error);
      return '1.0.0';
    }
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
    const parts2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }

  /**
   * Check if an update is available
   */
  async isUpdateAvailable(): Promise<{ available: boolean; currentVersion: string; latestVersion: string; versionInfo?: VersionInfo }> {
    const currentVersion = this.getCurrentVersion();
    const manifest = await this.fetchUpdateManifest();
    
    if (!manifest) {
      return { available: false, currentVersion, latestVersion: currentVersion };
    }

    const latestVersion = manifest.latestStable || manifest.latestVersion;
    const available = this.compareVersions(currentVersion, latestVersion) < 0;
    
    const versionInfo = manifest.versions.find(v => v.version === latestVersion);
    
    return { available, currentVersion, latestVersion, versionInfo };
  }

  /**
   * Get all available versions newer than current
   */
  async getAvailableUpdates(): Promise<VersionInfo[]> {
    const currentVersion = this.getCurrentVersion();
    const manifest = await this.fetchUpdateManifest();
    
    if (!manifest) return [];
    
    return manifest.versions
      .filter(v => this.compareVersions(currentVersion, v.version) < 0)
      .sort((a, b) => this.compareVersions(b.version, a.version));
  }

  /**
   * Fetch update manifest from update server (GitHub releases or custom server)
   */
  async fetchUpdateManifest(): Promise<UpdateManifest | null> {
    // Return cached manifest if still valid
    if (this.manifestCache && Date.now() - this.manifestCacheTime < this.MANIFEST_CACHE_DURATION) {
      return this.manifestCache;
    }

    try {
      // Try to get custom update server from settings
      const updateServerSetting = await this.prisma.setting.findUnique({
        where: { key: 'update_server_url' },
      });
      
      const updateServerUrl = updateServerSetting?.value as string || this.DEFAULT_UPDATE_SERVER;
      
      // Fetch from GitHub releases API or custom manifest
      const manifest = await this.fetchFromGitHub(updateServerUrl);
      
      if (manifest) {
        this.manifestCache = manifest;
        this.manifestCacheTime = Date.now();
      }
      
      return manifest;
    } catch (error) {
      this.logger.error('Failed to fetch update manifest', error);
      return null;
    }
  }

  /**
   * Fetch releases from GitHub API and convert to manifest format
   */
  private async fetchFromGitHub(url: string): Promise<UpdateManifest | null> {
    return new Promise((resolve) => {
      const options = {
        headers: {
          'User-Agent': 'WordPress-Node-CMS',
          'Accept': 'application/vnd.github.v3+json',
        },
      };

      https.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const releases = JSON.parse(data);
            if (!Array.isArray(releases)) {
              resolve(null);
              return;
            }
            resolve(this.parseGitHubReleases(releases));
          } catch { resolve(null); }
        });
      }).on('error', () => resolve(null));
    });
  }

  /**
   * Parse GitHub releases into UpdateManifest format
   */
  private parseGitHubReleases(releases: any[]): UpdateManifest {
    const versions: VersionInfo[] = releases
      .filter(r => !r.draft)
      .map(release => {
        const asset = release.assets?.find((a: any) =>
          a.name.endsWith('.zip') || a.name.includes('wordpress-node')
        );

        return {
          version: release.tag_name?.replace(/^v/, '') || release.name,
          releaseDate: release.published_at || release.created_at,
          changelog: release.body || '',
          releaseNotes: release.body || '',
          downloadUrl: asset?.browser_download_url || release.zipball_url || '',
          checksum: '',
          fileSize: asset?.size || 0,
          minNodeVersion: '18.0.0',
          minNpmVersion: '8.0.0',
          breakingChanges: release.body?.toLowerCase().includes('breaking') || false,
          requiresManualSteps: release.body?.toLowerCase().includes('manual') || false,
          manualStepsDescription: undefined,
        };
      });

    const stableVersions = versions.filter(v => !v.version.includes('-'));

    return {
      latestVersion: versions[0]?.version || '1.0.0',
      latestStable: stableVersions[0]?.version || versions[0]?.version || '1.0.0',
      versions,
      updateServerUrl: this.DEFAULT_UPDATE_SERVER,
    };
  }

  /**
   * Record current version in database
   */
  async recordCurrentVersion(): Promise<void> {
    const currentVersion = this.getCurrentVersion();

    await this.prisma.systemVersion.updateMany({
      where: { isCurrentVersion: true },
      data: { isCurrentVersion: false },
    });

    await this.prisma.systemVersion.upsert({
      where: { version: currentVersion },
      create: {
        version: currentVersion,
        isCurrentVersion: true,
        installedAt: new Date(),
      },
      update: {
        isCurrentVersion: true,
        installedAt: new Date(),
      },
    });
  }

  /**
   * Get version history from database
   */
  async getVersionHistory() {
    return this.prisma.systemVersion.findMany({
      orderBy: { installedAt: 'desc' },
    });
  }

  /**
   * Check system compatibility for update
   */
  async checkCompatibility(targetVersion: string): Promise<{
    compatible: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    const nodeVersion = process.version.replace('v', '');
    const manifest = await this.fetchUpdateManifest();
    const versionInfo = manifest?.versions.find(v => v.version === targetVersion);

    if (versionInfo?.minNodeVersion) {
      if (this.compareVersions(nodeVersion, versionInfo.minNodeVersion) < 0) {
        issues.push(`Node.js ${versionInfo.minNodeVersion}+ required. Current: ${nodeVersion}`);
      }
    }

    try {
      const stats = fs.statfsSync(process.cwd());
      const freeSpaceGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
      if (freeSpaceGB < 0.5) {
        issues.push(`Insufficient disk space. At least 500MB required.`);
      }
    } catch { /* ignore */ }

    if (versionInfo?.breakingChanges) {
      warnings.push('This version contains breaking changes.');
    }

    if (versionInfo?.requiresManualSteps) {
      warnings.push('This update requires manual steps.');
    }

    return { compatible: issues.length === 0, issues, warnings };
  }
}

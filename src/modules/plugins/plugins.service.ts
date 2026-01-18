/**
 * Plugins Service
 * Handles plugin management and database operations
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as AdmZip from 'adm-zip';

// Required fields in plugin.json
const REQUIRED_PLUGIN_JSON_FIELDS = ['name', 'version'];

// Maximum plugin file size (10MB)
const MAX_PLUGIN_SIZE = 10 * 1024 * 1024;

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  pluginConfig?: any;
  pluginSlug?: string;
  rootFolder?: string;
}

@Injectable()
export class PluginsService {
  private pluginsDir = path.join(process.cwd(), 'plugins');

  constructor(private prisma: PrismaService) {}

  /**
   * Scan plugins directory and register plugins
   */
  async scanPlugins() {
    try {
      const dirs = await fs.readdir(this.pluginsDir);
      const plugins: any[] = [];

      for (const dir of dirs) {
        const pluginPath = path.join(this.pluginsDir, dir);
        const stat = await fs.stat(pluginPath);

        if (stat.isDirectory()) {
          const configPath = path.join(pluginPath, 'plugin.json');

          try {
            const configContent = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configContent);

            // Upsert plugin in database
            const plugin = await this.prisma.plugin.upsert({
              where: { slug: dir },
              update: {
                name: config.name,
                version: config.version,
                author: config.author,
                description: config.description,
                config,
              },
              create: {
                name: config.name,
                slug: dir,
                version: config.version,
                author: config.author,
                description: config.description,
                path: `/plugins/${dir}`,
                config,
              },
            });

            plugins.push(plugin);
          } catch (error) {
            console.error(`Error loading plugin ${dir}:`, error.message);
          }
        }
      }

      return plugins;
    } catch (error) {
      console.error('Error scanning plugins:', error);
      return [];
    }
  }

  /**
   * Get all plugins
   */
  async findAll() {
    return this.prisma.plugin.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get active plugins
   */
  async findActive() {
    return this.prisma.plugin.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get plugin by ID
   */
  async findById(id: string) {
    const plugin = await this.prisma.plugin.findUnique({
      where: { id },
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return plugin;
  }

  /**
   * Activate a plugin
   */
  async activate(id: string) {
    return this.prisma.plugin.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(id: string) {
    return this.prisma.plugin.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Update plugin settings
   */
  async updateSettings(id: string, settings: any) {
    return this.prisma.plugin.update({
      where: { id },
      data: { settings },
    });
  }

  /**
   * Get plugin path
   */
  getPluginPath(pluginSlug: string): string {
    return path.join(this.pluginsDir, pluginSlug);
  }

  /**
   * Validate plugin ZIP file
   */
  validatePluginZip(file: Express.Multer.File): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file type
    if (!file.originalname.endsWith('.zip')) {
      errors.push('Only ZIP files are allowed');
      return { valid: false, errors, warnings };
    }

    // Check file size
    if (file.size > MAX_PLUGIN_SIZE) {
      errors.push(`File size exceeds maximum allowed size of ${MAX_PLUGIN_SIZE / 1024 / 1024}MB`);
      return { valid: false, errors, warnings };
    }

    try {
      const zip = new AdmZip(file.buffer);
      const zipEntries = zip.getEntries();
      const entryNames = zipEntries
        .filter((e) => !e.entryName.includes('__MACOSX'))
        .map((e) => e.entryName);

      // Find root folder (if any)
      let rootFolder: string | undefined;
      const dirs = entryNames.filter((name) => name.endsWith('/') && !name.includes('/', 0));
      if (dirs.length === 1) {
        rootFolder = dirs[0].replace('/', '');
      }

      // Find plugin.json
      const pluginJsonPath = rootFolder
        ? entryNames.find((name) => name === `${rootFolder}/plugin.json`)
        : entryNames.find((name) => name === 'plugin.json');

      if (!pluginJsonPath) {
        errors.push('plugin.json not found in the archive');
        return { valid: false, errors, warnings };
      }

      // Parse plugin.json
      const pluginJsonEntry = zip.getEntry(pluginJsonPath);
      if (!pluginJsonEntry) {
        errors.push('Could not read plugin.json');
        return { valid: false, errors, warnings };
      }

      let pluginConfig: any;
      try {
        pluginConfig = JSON.parse(pluginJsonEntry.getData().toString('utf8'));
      } catch (_e) {
        errors.push('plugin.json is not valid JSON');
        return { valid: false, errors, warnings };
      }

      // Validate required fields
      for (const field of REQUIRED_PLUGIN_JSON_FIELDS) {
        if (!pluginConfig[field]) {
          errors.push(`plugin.json missing required field: ${field}`);
        }
      }

      // Determine plugin slug
      const pluginSlug =
        rootFolder ||
        path
          .basename(file.originalname, '.zip')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-');

      // Check for entry file
      const entryFile = pluginConfig.entry || 'index.js';
      const entryPath = rootFolder ? `${rootFolder}/${entryFile}` : entryFile;
      if (!entryNames.some((name) => name === entryPath)) {
        warnings.push(`Entry file "${entryFile}" not found - plugin may not load correctly`);
      }

      // Check for hooks
      if (!pluginConfig.hooks || pluginConfig.hooks.length === 0) {
        warnings.push('No hooks defined - plugin may not do anything');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        pluginConfig,
        pluginSlug,
        rootFolder,
      };
    } catch (error) {
      errors.push('Failed to read ZIP file: ' + error.message);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validate plugin without installing
   */
  async validatePlugin(
    file: Express.Multer.File,
  ): Promise<PluginValidationResult & { exists?: boolean }> {
    const validation = this.validatePluginZip(file);

    if (validation.valid && validation.pluginSlug) {
      const existingPlugin = await this.prisma.plugin.findUnique({
        where: { slug: validation.pluginSlug },
      });
      if (existingPlugin) {
        validation.errors.push(
          `Plugin "${validation.pluginSlug}" already exists. Please delete it first or use a different folder name.`,
        );
        validation.valid = false;
        return { ...validation, exists: true };
      }
    }

    return validation;
  }

  /**
   * Upload and install plugin from ZIP
   */
  async uploadPlugin(file: Express.Multer.File) {
    const validation = await this.validatePlugin(file);

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Plugin validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const { pluginConfig, pluginSlug, rootFolder } = validation;

    try {
      const zip = new AdmZip(file.buffer);
      const extractPath = path.join(this.pluginsDir, pluginSlug!);

      // Create plugin directory
      await fs.mkdir(extractPath, { recursive: true });

      // Extract files
      if (rootFolder) {
        // Extract contents of root folder directly to plugin directory
        const entries = zip
          .getEntries()
          .filter(
            (e) => !e.entryName.includes('__MACOSX') && e.entryName.startsWith(rootFolder + '/'),
          );
        for (const entry of entries) {
          const relativePath = entry.entryName.substring(rootFolder.length + 1);
          if (!relativePath) continue;

          // Prevent path traversal attacks
          const targetPath = path.resolve(extractPath, relativePath);
          if (!targetPath.startsWith(path.resolve(extractPath) + path.sep)) {
            throw new BadRequestException(`Invalid path in plugin archive: ${relativePath}`);
          }

          if (entry.isDirectory) {
            await fs.mkdir(targetPath, { recursive: true });
          } else {
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            await fs.writeFile(targetPath, entry.getData());
          }
        }
      } else {
        // Extract directly
        zip.extractAllTo(extractPath, true);
      }

      // Register plugin in database
      const plugin = await this.prisma.plugin.create({
        data: {
          name: pluginConfig!.name,
          slug: pluginSlug!,
          version: pluginConfig!.version,
          author: pluginConfig!.author || 'Unknown',
          description: pluginConfig!.description || '',
          path: `/plugins/${pluginSlug}`,
          config: pluginConfig,
        },
      });

      return {
        ...plugin,
        warnings: validation.warnings,
      };
    } catch (error) {
      // Clean up on failure
      try {
        const pluginPath = path.join(this.pluginsDir, pluginSlug!);
        await fs.rm(pluginPath, { recursive: true, force: true });
      } catch {}

      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error uploading plugin:', error);
      throw new BadRequestException('Failed to upload plugin: ' + error.message);
    }
  }

  /**
   * Delete a plugin
   */
  async deletePlugin(id: string) {
    const plugin = await this.findById(id);

    if (plugin.isActive) {
      throw new BadRequestException('Cannot delete an active plugin. Deactivate it first.');
    }

    // Delete plugin files
    try {
      const pluginPath = path.join(this.pluginsDir, plugin.slug);
      await fs.rm(pluginPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error deleting plugin files for ${plugin.slug}:`, error);
    }

    // Delete from database
    return this.prisma.plugin.delete({
      where: { id },
    });
  }
}

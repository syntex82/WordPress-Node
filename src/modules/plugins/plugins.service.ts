/**
 * Plugins Service
 * Handles plugin management and database operations
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

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
}


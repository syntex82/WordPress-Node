/**
 * Plugin Loader Service
 * Handles plugin loading and lifecycle hooks
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import * as path from 'path';

export interface PluginHooks {
  onActivate?: () => Promise<void> | void;
  onDeactivate?: () => Promise<void> | void;
  beforeSave?: (data: any) => Promise<any> | any;
  afterSave?: (data: any) => Promise<void> | void;
  beforeDelete?: (id: string) => Promise<void> | void;
  afterDelete?: (id: string) => Promise<void> | void;
  registerRoutes?: (app: any) => void;
  registerFields?: () => any[];
}

@Injectable()
export class PluginLoaderService implements OnModuleInit {
  private loadedPlugins: Map<string, PluginHooks> = new Map();

  constructor(private pluginsService: PluginsService) {}

  async onModuleInit() {
    await this.loadActivePlugins();
  }

  /**
   * Load all active plugins
   */
  async loadActivePlugins() {
    const activePlugins = await this.pluginsService.findActive();

    for (const plugin of activePlugins) {
      try {
        await this.loadPlugin(plugin.slug);
      } catch (error) {
        console.error(`Error loading plugin ${plugin.slug}:`, error);
      }
    }
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(slug: string) {
    try {
      const pluginPath = this.pluginsService.getPluginPath(slug);
      const entryFile = path.join(pluginPath, 'index.js');

      // Dynamically import the plugin
      const pluginModule = await import(entryFile);
      const pluginInstance = pluginModule.default || pluginModule;

      this.loadedPlugins.set(slug, pluginInstance);

      // Call onActivate hook if it exists
      if (pluginInstance.onActivate) {
        await pluginInstance.onActivate();
      }

      console.log(`✅ Plugin loaded: ${slug}`);
    } catch (error) {
      console.error(`Error loading plugin ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(slug: string) {
    const plugin = this.loadedPlugins.get(slug);

    if (plugin && plugin.onDeactivate) {
      await plugin.onDeactivate();
    }

    this.loadedPlugins.delete(slug);
    console.log(`Plugin unloaded: ${slug}`);
  }

  /**
   * Execute a hook across all loaded plugins
   */
  async executeHook(hookName: keyof PluginHooks, ...args: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const [slug, plugin] of this.loadedPlugins.entries()) {
      const hook = plugin[hookName] as any;

      if (typeof hook === 'function') {
        try {
          const result = await hook(...args);
          results.push({ slug, result });
        } catch (error) {
          console.error(`Error executing ${hookName} hook in plugin ${slug}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.keys());
  }

  /**
   * Check if a plugin is loaded
   */
  isPluginLoaded(slug: string): boolean {
    return this.loadedPlugins.has(slug);
  }
}

/**
 * Plugin Loader Service
 * Handles plugin loading and lifecycle hooks
 */

import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';

// Use createRequire for dynamic module loading (safer than eval)
// This allows runtime loading of plugins that aren't bundled
const dynamicRequire = createRequire(__filename);

/**
 * Validate plugin slug to prevent path traversal attacks
 */
function validatePluginSlug(slug: string): void {
  if (!slug || typeof slug !== 'string') {
    throw new BadRequestException('Plugin slug is required');
  }
  // Only allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    throw new BadRequestException('Plugin slug contains invalid characters');
  }
  // Prevent path traversal
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    throw new BadRequestException('Invalid plugin slug');
  }
}

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
  private expressApp: any = null;

  constructor(private pluginsService: PluginsService) {}

  async onModuleInit() {
    await this.loadActivePlugins();
  }

  /**
   * Set the Express app instance for plugin route registration
   */
  setExpressApp(app: any) {
    this.expressApp = app;
    // Register routes for already loaded plugins
    for (const [slug, plugin] of this.loadedPlugins.entries()) {
      if (plugin.registerRoutes && this.expressApp) {
        try {
          plugin.registerRoutes(this.expressApp);
          console.log(`✅ Plugin routes registered: ${slug}`);
        } catch (error) {
          console.error(`Error registering routes for plugin ${slug}:`, error);
        }
      }
    }
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
    // Validate plugin slug to prevent path traversal
    validatePluginSlug(slug);

    try {
      const pluginPath = this.pluginsService.getPluginPath(slug);
      const entryFile = path.join(pluginPath, 'index.js');

      // Validate that the resolved path is within the plugins directory
      const pluginsBaseDir = path.resolve(process.cwd(), 'plugins');
      const resolvedPath = path.resolve(entryFile);
      if (!resolvedPath.startsWith(pluginsBaseDir)) {
        throw new BadRequestException('Invalid plugin path');
      }

      // Check if the plugin file exists
      if (!fs.existsSync(entryFile)) {
        console.warn(`⚠️ Plugin file not found: ${entryFile}`);
        return;
      }

      // Clear require cache to allow hot reloading
      const resolvedModule = dynamicRequire.resolve(entryFile);
      delete dynamicRequire.cache[resolvedModule];

      // Use dynamic require to load plugin at runtime (bypasses webpack bundling)
      const pluginModule = dynamicRequire(entryFile);
      const pluginInstance = pluginModule.default || pluginModule;

      this.loadedPlugins.set(slug, pluginInstance);

      // Call onActivate hook if it exists
      if (pluginInstance.onActivate) {
        await pluginInstance.onActivate();
      }

      // Register routes if Express app is available
      if (pluginInstance.registerRoutes && this.expressApp) {
        try {
          pluginInstance.registerRoutes(this.expressApp);
          console.log(`✅ Plugin routes registered: ${slug}`);
        } catch (error) {
          console.error(`Error registering routes for plugin ${slug}:`, error);
        }
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

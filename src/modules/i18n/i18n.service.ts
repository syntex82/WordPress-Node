/**
 * Internationalization Service
 * Core service for managing languages and translations
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  private languageCache: Map<string, any> = new Map();
  private defaultLanguage: any = null;

  constructor(private prisma: PrismaService) {
    this.loadLanguageCache();
  }

  // ==================== LANGUAGE MANAGEMENT ====================

  async loadLanguageCache() {
    try {
      const languages = await this.prisma.language.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      this.languageCache.clear();
      languages.forEach((lang) => {
        this.languageCache.set(lang.code, lang);
        if (lang.isDefault) {
          this.defaultLanguage = lang;
        }
      });
      this.logger.log(`Loaded ${languages.length} languages into cache`);
    } catch (error) {
      this.logger.warn('Failed to load language cache, will retry on first request');
    }
  }

  async getLanguages(includeInactive = false) {
    return this.prisma.language.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getLanguageByCode(code: string) {
    if (this.languageCache.has(code)) {
      return this.languageCache.get(code);
    }
    const language = await this.prisma.language.findUnique({ where: { code } });
    if (language) {
      this.languageCache.set(code, language);
    }
    return language;
  }

  async getDefaultLanguage() {
    if (this.defaultLanguage) {
      return this.defaultLanguage;
    }
    const defaultLang = await this.prisma.language.findFirst({
      where: { isDefault: true, isActive: true },
    });
    if (defaultLang) {
      this.defaultLanguage = defaultLang;
    }
    return defaultLang;
  }

  async createLanguage(data: {
    code: string;
    name: string;
    nativeName: string;
    isRTL?: boolean;
    flagEmoji?: string;
    locale?: string;
    dateFormat?: string;
    numberFormat?: string;
  }) {
    // Check if code already exists
    const existing = await this.prisma.language.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new BadRequestException(`Language with code "${data.code}" already exists`);
    }

    const language = await this.prisma.language.create({ data });
    this.languageCache.set(language.code, language);
    this.logger.log(`Created language: ${language.name} (${language.code})`);
    return language;
  }

  async updateLanguage(id: string, data: Partial<{
    name: string;
    nativeName: string;
    isActive: boolean;
    isDefault: boolean;
    isRTL: boolean;
    flagEmoji: string;
    locale: string;
    dateFormat: string;
    numberFormat: string;
    sortOrder: number;
  }>) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const language = await this.prisma.language.update({
      where: { id },
      data,
    });

    // Refresh cache
    await this.loadLanguageCache();
    return language;
  }

  async deleteLanguage(id: string) {
    const language = await this.prisma.language.findUnique({ where: { id } });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    if (language.isDefault) {
      throw new BadRequestException('Cannot delete the default language');
    }

    await this.prisma.language.delete({ where: { id } });
    this.languageCache.delete(language.code);
    this.logger.log(`Deleted language: ${language.name} (${language.code})`);
    return { success: true };
  }

  // ==================== LANGUAGE DETECTION ====================

  detectLanguageFromHeader(acceptLanguage: string | undefined): string {
    if (!acceptLanguage) {
      return this.defaultLanguage?.code || 'en';
    }

    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, qValue] = lang.trim().split(';q=');
        return {
          code: code.split('-')[0].toLowerCase(), // Get primary language code
          quality: qValue ? parseFloat(qValue) : 1,
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find first matching active language
    for (const { code } of languages) {
      if (this.languageCache.has(code)) {
        return code;
      }
    }

    return this.defaultLanguage?.code || 'en';
  }

  // ==================== UI TRANSLATIONS ====================

  async getUITranslations(languageCode: string, namespace?: string) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      throw new NotFoundException(`Language "${languageCode}" not found`);
    }

    const translations = await this.prisma.uITranslation.findMany({
      where: {
        languageId: language.id,
        ...(namespace ? { namespace } : {}),
      },
    });

    // Convert to nested object format for i18next
    const result: Record<string, Record<string, string>> = {};
    translations.forEach((t) => {
      if (!result[t.namespace]) {
        result[t.namespace] = {};
      }
      result[t.namespace][t.key] = t.value;
    });

    return result;
  }

  async setUITranslation(languageCode: string, namespace: string, key: string, value: string) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      throw new NotFoundException(`Language "${languageCode}" not found`);
    }

    return this.prisma.uITranslation.upsert({
      where: {
        languageId_namespace_key: {
          languageId: language.id,
          namespace,
          key,
        },
      },
      update: { value },
      create: {
        languageId: language.id,
        namespace,
        key,
        value,
      },
    });
  }

  async bulkSetUITranslations(
    languageCode: string,
    translations: { namespace: string; key: string; value: string }[],
  ) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      throw new NotFoundException(`Language "${languageCode}" not found`);
    }

    const results = await Promise.all(
      translations.map((t) =>
        this.prisma.uITranslation.upsert({
          where: {
            languageId_namespace_key: {
              languageId: language.id,
              namespace: t.namespace,
              key: t.key,
            },
          },
          update: { value: t.value },
          create: {
            languageId: language.id,
            namespace: t.namespace,
            key: t.key,
            value: t.value,
          },
        }),
      ),
    );

    return { updated: results.length };
  }

  // ==================== CONTENT TRANSLATIONS ====================

  async getPostTranslation(postId: string, languageCode: string) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) return null;

    return this.prisma.postTranslation.findUnique({
      where: {
        postId_languageId: { postId, languageId: language.id },
      },
    });
  }

  async getPostTranslations(postId: string) {
    return this.prisma.postTranslation.findMany({
      where: { postId },
      include: { language: true },
    });
  }

  async createOrUpdatePostTranslation(
    postId: string,
    languageCode: string,
    data: {
      title: string;
      slug: string;
      content: string;
      excerpt?: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    },
  ) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      throw new NotFoundException(`Language "${languageCode}" not found`);
    }

    return this.prisma.postTranslation.upsert({
      where: {
        postId_languageId: { postId, languageId: language.id },
      },
      update: data,
      create: {
        postId,
        languageId: language.id,
        ...data,
      },
    });
  }

  async getPageTranslation(pageId: string, languageCode: string) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) return null;

    return this.prisma.pageTranslation.findUnique({
      where: {
        pageId_languageId: { pageId, languageId: language.id },
      },
    });
  }

  async createOrUpdatePageTranslation(
    pageId: string,
    languageCode: string,
    data: {
      title: string;
      slug: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    },
  ) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      throw new NotFoundException(`Language "${languageCode}" not found`);
    }

    return this.prisma.pageTranslation.upsert({
      where: {
        pageId_languageId: { pageId, languageId: language.id },
      },
      update: data,
      create: {
        pageId,
        languageId: language.id,
        ...data,
      },
    });
  }

  async getProductTranslation(productId: string, languageCode: string) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) return null;

    return this.prisma.productTranslation.findUnique({
      where: {
        productId_languageId: { productId, languageId: language.id },
      },
    });
  }

  async createOrUpdateProductTranslation(
    productId: string,
    languageCode: string,
    data: {
      name: string;
      slug: string;
      description?: string;
      shortDescription?: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    },
  ) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      throw new NotFoundException(`Language "${languageCode}" not found`);
    }

    return this.prisma.productTranslation.upsert({
      where: {
        productId_languageId: { productId, languageId: language.id },
      },
      update: data,
      create: {
        productId,
        languageId: language.id,
        ...data,
      },
    });
  }

  async getCourseTranslation(courseId: string, languageCode: string) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) return null;

    return this.prisma.courseTranslation.findUnique({
      where: {
        courseId_languageId: { courseId, languageId: language.id },
      },
    });
  }

  async createOrUpdateCourseTranslation(
    courseId: string,
    languageCode: string,
    data: {
      title: string;
      slug: string;
      description?: string;
      shortDescription?: string;
      whatYouLearn?: any;
      requirements?: any;
      isPublished?: boolean;
    },
  ) {
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      throw new NotFoundException(`Language "${languageCode}" not found`);
    }

    return this.prisma.courseTranslation.upsert({
      where: {
        courseId_languageId: { courseId, languageId: language.id },
      },
      update: data,
      create: {
        courseId,
        languageId: language.id,
        ...data,
      },
    });
  }

  // ==================== SEED DEFAULT LANGUAGES ====================

  async seedDefaultLanguages() {
    const defaultLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇬🇧', locale: 'en-GB', isDefault: true },
      { code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸', locale: 'es-ES' },
      { code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷', locale: 'fr-FR' },
      { code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪', locale: 'de-DE' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', flagEmoji: '🇮🇹', locale: 'it-IT' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', flagEmoji: '🇵🇹', locale: 'pt-PT' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', flagEmoji: '🇸🇦', locale: 'ar-SA', isRTL: true },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית', flagEmoji: '🇮🇱', locale: 'he-IL', isRTL: true },
      { code: 'zh', name: 'Chinese', nativeName: '中文', flagEmoji: '🇨🇳', locale: 'zh-CN' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵', locale: 'ja-JP' },
    ];

    let created = 0;
    for (const lang of defaultLanguages) {
      const existing = await this.prisma.language.findUnique({ where: { code: lang.code } });
      if (!existing) {
        await this.prisma.language.create({ data: { ...lang, sortOrder: created } });
        created++;
      }
    }

    await this.loadLanguageCache();
    this.logger.log(`Seeded ${created} default languages`);
    return { created };
  }
}


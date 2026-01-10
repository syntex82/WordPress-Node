/**
 * Language Detection Middleware
 * Detects and sets the current language for each request
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from '../i18n.service';

// Extend Express Request to include language info
declare global {
  namespace Express {
    interface Request {
      language?: string;
      languageData?: any;
    }
  }
}

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LanguageMiddleware.name);

  constructor(private readonly i18nService: I18nService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Priority order for language detection:
    // 1. Query parameter (?lang=es)
    // 2. Custom header (X-Language)
    // 3. Cookie (language)
    // 4. Accept-Language header
    // 5. Default language

    let languageCode: string | undefined;

    // 1. Check query parameter
    if (req.query.lang && typeof req.query.lang === 'string') {
      languageCode = req.query.lang;
    }

    // 2. Check custom header
    if (!languageCode && req.headers['x-language']) {
      languageCode = req.headers['x-language'] as string;
    }

    // 3. Check cookie
    if (!languageCode && req.cookies?.language) {
      languageCode = req.cookies.language;
    }

    // 4. Check Accept-Language header
    if (!languageCode) {
      languageCode = this.i18nService.detectLanguageFromHeader(req.headers['accept-language']);
    }

    // Validate the language code exists
    const languageData = await this.i18nService.getLanguageByCode(languageCode);
    
    if (languageData) {
      req.language = languageCode;
      req.languageData = languageData;
    } else {
      // Fall back to default language
      const defaultLang = await this.i18nService.getDefaultLanguage();
      req.language = defaultLang?.code || 'en';
      req.languageData = defaultLang;
    }

    // Set response header for client
    res.setHeader('Content-Language', req.language);

    next();
  }
}


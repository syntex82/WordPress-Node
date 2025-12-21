/**
 * Encryption Service
 * Handles AES-256-GCM encryption/decryption for sensitive configuration values
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeKey();
  }

  private initializeKey() {
    // Use ENCRYPTION_KEY from env, or derive from JWT_SECRET as fallback
    let keySource = this.configService.get<string>('ENCRYPTION_KEY');
    
    if (!keySource) {
      keySource = this.configService.get<string>('JWT_SECRET');
      if (keySource) {
        this.logger.warn('ENCRYPTION_KEY not set, deriving from JWT_SECRET. Set ENCRYPTION_KEY for production.');
      }
    }

    if (!keySource) {
      // Generate a random key for development (not persistent!)
      this.logger.error('No encryption key available! Using random key - data will not persist across restarts!');
      this.encryptionKey = crypto.randomBytes(32);
      return;
    }

    // Derive a 256-bit key using PBKDF2
    this.encryptionKey = crypto.pbkdf2Sync(
      keySource,
      'wordpress-node-salt',
      100000,
      32,
      'sha256'
    );
    this.logger.log('Encryption service initialized');
  }

  /**
   * Encrypt a string value
   * Returns base64 encoded string: iv:authTag:encryptedData
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypt a string value
   * Expects base64 encoded string: iv:authTag:encryptedData
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const iv = Buffer.from(parts[0], 'base64');
      const authTag = Buffer.from(parts[1], 'base64');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to decrypt value');
    }
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a value using SHA-256
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}


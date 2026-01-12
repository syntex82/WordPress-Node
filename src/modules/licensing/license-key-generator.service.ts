/**
 * License Key Generator Service
 * Generates cryptographically secure license keys for NodePress
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface LicensePayload {
  email: string;
  tier: string;
  createdAt: number;
  expiresAt?: number;
  maxSites: number;
  features: string[];
}

@Injectable()
export class LicenseKeyGenerator {
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('LICENSE_SECRET_KEY') 
      || this.configService.get<string>('JWT_SECRET') 
      || 'nodepress-license-secret-change-in-production';
  }

  /**
   * Generate a cryptographically secure license key
   * Format: NP-TIER-XXXXXXXX-XXXXXXXX-XXXX
   */
  generateKey(data: {
    email: string;
    tier: string;
    expiresAt?: Date;
    maxSites: number;
    features: string[];
  }): string {
    const payload: LicensePayload = {
      email: data.email.toLowerCase(),
      tier: data.tier,
      createdAt: Date.now(),
      expiresAt: data.expiresAt?.getTime(),
      maxSites: data.maxSites,
      features: data.features,
    };

    // Create signature
    const signature = this.createSignature(JSON.stringify(payload));
    
    // Encode payload with signature
    const encoded = Buffer.from(
      JSON.stringify({ ...payload, sig: signature })
    ).toString('base64url');

    // Format as readable license key
    return this.formatLicenseKey(data.tier, encoded);
  }

  /**
   * Decode and validate a license key
   */
  decodeKey(licenseKey: string): {
    valid: boolean;
    payload?: LicensePayload;
    error?: string;
  } {
    try {
      // Extract encoded part (remove prefix)
      const parts = licenseKey.split('-');
      if (parts.length < 3) {
        return { valid: false, error: 'Invalid license key format' };
      }

      // Reconstruct encoded string (skip NP and TIER prefix)
      const encoded = parts.slice(2).join('');
      
      // Decode
      const decoded = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8')
      );

      const { sig, ...payload } = decoded;

      // Verify signature
      const expectedSig = this.createSignature(JSON.stringify(payload));
      if (sig !== expectedSig) {
        return { valid: false, error: 'Invalid license signature' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Failed to decode license key' };
    }
  }

  /**
   * Create HMAC signature for payload
   */
  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Format encoded data as readable license key
   */
  private formatLicenseKey(tier: string, encoded: string): string {
    // Split into groups for readability
    const groups: string[] = [];
    for (let i = 0; i < encoded.length; i += 8) {
      groups.push(encoded.substring(i, i + 8).toUpperCase());
    }
    
    // Limit to 4 groups for manageable key length
    const keyBody = groups.slice(0, 4).join('-');
    
    // Add checksum
    const checksum = this.createSignature(keyBody).substring(0, 4).toUpperCase();
    
    return `NP-${tier.toUpperCase()}-${keyBody}-${checksum}`;
  }

  /**
   * Generate a simple activation token for domain binding
   */
  generateActivationToken(licenseId: string, domain: string): string {
    const data = `${licenseId}:${domain}:${Date.now()}`;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');
  }
}


import { ethers } from 'ethers';
import DOMPurify from 'dompurify';
import { Buffer } from 'buffer';

// Cross-platform crypto utilities
const crypto = {
  randomBytes: (size: number): Uint8Array => {
    if (typeof window !== 'undefined' && window.crypto) {
      return window.crypto.getRandomValues(new Uint8Array(size));
    }
    return Buffer.from(Math.random().toString(36).substring(2, 2 + size));
  },
  
  generateCSRFToken: (): string => {
    return crypto.randomBytes(32).toString('hex');
  }
};

// Rate limiting implementation
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private cleanupInterval: number;

  constructor(cleanupIntervalMs: number = 60000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  isAllowed(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const windowStart = now - window;
    
    const recentRequests = timestamps.filter(t => t > windowStart);
    if (recentRequests.length >= limit) return false;
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      this.requests.set(key, timestamps.filter(t => t > now - 3600000)); // Keep last hour
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Input validation and sanitization
export const validators = {
  validateDID: (did: string): boolean => {
    const didRegex = /^did:ethr:0x[a-fA-F0-9]{40}$/;
    return didRegex.test(did);
  },

  validateAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  sanitizeInput: (input: string): string => {
    return DOMPurify.sanitize(input);
  }
};

// Secure storage implementation
export class SecureStorage {
  private storage: Storage;
  private encryptionKey: CryptoKey | null = null;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  async initialize(encryptionKey: CryptoKey): Promise<void> {
    this.encryptionKey = encryptionKey;
  }

  async setItem(key: string, value: any): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('SecureStorage not initialized');
    }

    const encrypted = await this.encrypt(JSON.stringify(value));
    this.storage.setItem(key, encrypted);
  }

  async getItem<T>(key: string): Promise<T | null> {
    if (!this.encryptionKey) {
      throw new Error('SecureStorage not initialized');
    }

    const encrypted = this.storage.getItem(key);
    if (!encrypted) return null;

    const decrypted = await this.decrypt(encrypted);
    return JSON.parse(decrypted);
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) throw new Error('No encryption key');
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const iv = crypto.randomBytes(12);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      dataBuffer
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...result));
  }

  private async decrypt(encrypted: string): Promise<string> {
    if (!this.encryptionKey) throw new Error('No encryption key');

    const decoder = new TextDecoder();
    const encryptedArray = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    const iv = encryptedArray.slice(0, 12);
    const data = encryptedArray.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      data
    );

    return decoder.decode(decryptedBuffer);
  }
}

// Security monitoring
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  logSecurityEvent(event: SecurityEvent): void {
    this.events.push(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }
    console.warn('Security Event:', event);
  }

  detectAnomalies(metrics: SecurityMetrics): void {
    // Implement anomaly detection logic here
    if (metrics.errorRate > 0.1) {
      this.logSecurityEvent({
        type: 'HIGH_ERROR_RATE',
        severity: 'HIGH',
        details: { errorRate: metrics.errorRate }
      });
    }
  }
}

// Types
export interface SecurityEvent {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: Record<string, unknown>;
}

export interface SecurityMetrics {
  requestCount: number;
  errorRate: number;
  responseTime: number;
  uniqueIPs: number;
  failedAttempts: number;
}

// Export singleton instances
export const rateLimiter = new RateLimiter();
export const secureStorage = new SecureStorage();
export const securityMonitor = SecurityMonitor.getInstance(); 
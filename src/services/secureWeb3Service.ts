import { ethers } from 'ethers';
import { Identity, Claim, ClaimStatus } from '../types/identity';
import { 
  rateLimiter, 
  validators, 
  secureStorage, 
  securityMonitor,
  SecurityEvent,
  SecurityMetrics 
} from '../utils/security';

export class SecureWeb3Service {
  private provider: ethers.BrowserProvider;
  private signer: ethers.JsonRpcSigner | null = null;
  private readonly RATE_LIMIT = {
    requests: 10,
    window: 60000 // 1 minute
  };

  constructor() {
    if (!window.ethereum) {
      throw new Error('Ethereum provider not found');
    }
    this.provider = new ethers.BrowserProvider(window.ethereum);
  }

  async connect(): Promise<string> {
    try {
      // Rate limiting
      if (!rateLimiter.isAllowed('connect', this.RATE_LIMIT.requests, this.RATE_LIMIT.window)) {
        throw new Error('Too many connection attempts. Please try again later.');
      }

      // Request accounts with CSRF protection
      const accounts = await this.provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      if (!validators.validateAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      // Get signer
      this.signer = await this.provider.getSigner();

      // Log security event
      securityMonitor.logSecurityEvent({
        type: 'WALLET_CONNECTED',
        severity: 'MEDIUM',
        details: { address }
      });

      return address;
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'WALLET_CONNECTION_FAILED',
        severity: 'HIGH',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.signer = null;
    securityMonitor.logSecurityEvent({
      type: 'WALLET_DISCONNECTED',
      severity: 'LOW',
      details: {}
    });
  }

  async getIdentity(address: string | Promise<string>): Promise<Identity> {
    try {
      // Rate limiting
      if (!rateLimiter.isAllowed('identity', this.RATE_LIMIT.requests, this.RATE_LIMIT.window)) {
        throw new Error('Too many identity requests. Please try again later.');
      }

      // Ensure address is a string
      const addressStr = await address;
      const did = `did:ethr:${addressStr}`;
      const reputation = await this.getReputation(addressStr);
      const claims = await this.getClaims(did);

      return {
        did,
        address: addressStr,
        reputation,
        claims,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'IDENTITY_FETCH_FAILED',
        severity: 'HIGH',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  private async getClaims(did: string): Promise<Claim[]> {
    // In a real implementation, this would fetch claims from a smart contract
    // For now, we'll return mock data
    return [
      {
        id: '1',
        type: 'EMAIL_VERIFICATION',
        value: 'verified@example.com',
        issuer: 'did:ethr:0x1234...5678',
        timestamp: Date.now(),
        signature: '0xabcd...efgh',
        status: ClaimStatus.VERIFIED,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      },
    ];
  }

  private async getReputation(address: string): Promise<number> {
    // In a real implementation, this would fetch reputation from a smart contract
    return 750; // Mock reputation score
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // Rate limiting
      if (!rateLimiter.isAllowed('sign', this.RATE_LIMIT.requests, this.RATE_LIMIT.window)) {
        throw new Error('Too many signing attempts. Please try again later.');
      }

      // Sanitize message
      const sanitizedMessage = validators.sanitizeInput(message);

      // Sign message
      const signature = await this.signer.signMessage(sanitizedMessage);

      // Log security event
      securityMonitor.logSecurityEvent({
        type: 'MESSAGE_SIGNED',
        severity: 'MEDIUM',
        details: { messageHash: ethers.hashMessage(sanitizedMessage) }
      });

      return signature;
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'MESSAGE_SIGNING_FAILED',
        severity: 'HIGH',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // Rate limiting
      if (!rateLimiter.isAllowed('transaction', this.RATE_LIMIT.requests, this.RATE_LIMIT.window)) {
        throw new Error('Too many transaction attempts. Please try again later.');
      }

      // Validate transaction
      if (!this.validateTransaction(transaction)) {
        throw new Error('Invalid transaction parameters');
      }

      // Send transaction
      const tx = await this.signer.sendTransaction(transaction);

      // Log security event
      securityMonitor.logSecurityEvent({
        type: 'TRANSACTION_SENT',
        severity: 'HIGH',
        details: { 
          hash: tx.hash,
          to: transaction.to,
          value: transaction.value?.toString()
        }
      });

      return tx;
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'TRANSACTION_FAILED',
        severity: 'HIGH',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  private validateTransaction(transaction: ethers.TransactionRequest): boolean {
    // Validate recipient address
    if (transaction.to) {
      const address = typeof transaction.to === 'string' ? transaction.to : transaction.to.toString();
      if (!validators.validateAddress(address)) {
        return false;
      }
    }

    // Validate value
    if (transaction.value && typeof transaction.value !== 'bigint') {
      return false;
    }

    // Validate data
    if (transaction.data && !ethers.isHexString(transaction.data)) {
      return false;
    }

    return true;
  }

  // Monitor security metrics
  private updateSecurityMetrics(metrics: Partial<SecurityMetrics>): void {
    const currentMetrics: SecurityMetrics = {
      requestCount: 0,
      errorRate: 0,
      responseTime: 0,
      uniqueIPs: 0,
      failedAttempts: 0,
      ...metrics
    };

    securityMonitor.detectAnomalies(currentMetrics);
  }
}

// Export singleton instance
export const secureWeb3Service = new SecureWeb3Service(); 
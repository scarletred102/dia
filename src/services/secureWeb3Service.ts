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
  private provider: ethers.BrowserProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private lastConnectionTime: number = 0;
  private connectionCooldown: number = 2000; // 2 seconds cooldown between connection attempts
  private lastIdentityFetch: Record<string, number> = {};
  private fetchCooldown: number = 1000; // 1 second cooldown between identity fetches
  private readonly RATE_LIMIT = {
    requests: 10,
    window: 60000 // 1 minute
  };

  constructor() {
    if (!window.ethereum) {
      throw new Error('Ethereum provider not found');
    }
  }

  async connectWallet(): Promise<{ wallet: ethers.Wallet, privateKey: string | null }> {
    this.checkRateLimit('connect');
    
    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum provider detected. Please install MetaMask.');
      }
      
      // Create a provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request accounts
      const accounts = await this.provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please ensure your wallet is unlocked.');
      }
      
      // Get the signer
      const signer = await this.provider.getSigner();
      
      // For testing purposes only - in a real app, we would NEVER expose the private key
      // This is just for demo purposes to show how credentials could be signed
      // In a real application, all signing would happen in the user's wallet
      const address = await signer.getAddress();
      
      // For demo purposes, we're creating a new random wallet
      // In a real app, all signing would be done via wallet interactions
      const randomWallet = ethers.Wallet.createRandom();
      this.wallet = randomWallet;
      
      // Log security event
      console.info(`[SECURITY] Wallet connected: ${address}`);
      
      return { 
        wallet: randomWallet,
        privateKey: randomWallet.privateKey
      };
      
    } catch (error) {
      console.error('[SECURITY] Wallet connection failed:', error);
      throw error;
    }
  }

  async connect(): Promise<string> {
    const connection = await this.connectWallet();
    return connection.wallet.address;
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.wallet = null;
    
    // Log security event
    console.info('[SECURITY] Wallet disconnected');
    
    return Promise.resolve();
  }

  async getIdentity(address: string): Promise<Identity> {
    this.checkRateLimit(`identity_${address}`);
    
    try {
      // In a real implementation, we would fetch this data from a blockchain or decentralized storage
      // For this demo, we're generating mock data
      
      // Log security event
      console.info(`[SECURITY] Identity fetch for: ${address}`);
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate DID (Decentralized Identifier)
      const did = `did:ethr:${address.toLowerCase()}`;
      
      // Generate mock reputation score (0-100)
      const reputation = Math.floor(Math.random() * 100);
      
      // Current timestamp
      const lastUpdated = new Date();
      
      // Mock claims
      const claims = [
        {
          id: '1',
          type: 'EmailVerification',
          value: 'verified@example.com',
          issuer: 'did:ethr:0x1234567890abcdef1234567890abcdef12345678',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          status: ClaimStatus.VERIFIED
        },
        {
          id: '2',
          type: 'KYCVerification',
          value: 'PASSED',
          issuer: 'did:ethr:0xabcdef1234567890abcdef1234567890abcdef12',
          timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          signature: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          status: ClaimStatus.VERIFIED,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          type: 'AddressVerification',
          value: 'PENDING',
          issuer: 'did:ethr:0x7890abcdef1234567890abcdef1234567890abcd',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          signature: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
          status: ClaimStatus.PENDING
        }
      ];
      
      // Create identity object
      const identity: Identity = {
        did,
        address,
        reputation,
        claims,
        lastUpdated
      };
      
      return identity;
      
    } catch (error) {
      // Log security event
      console.error(`[SECURITY] Identity fetch failed for: ${address}`, error);
      throw error;
    }
  }

  async getClaims(did: string) {
    // In a real implementation, this would fetch claims from a verifiable credentials registry
    // For this demo, we're generating mock data
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock claims (same as in getIdentity)
    return [
      {
        id: '1',
        type: 'EmailVerification',
        value: 'verified@example.com',
        issuer: 'did:ethr:0x1234567890abcdef1234567890abcdef12345678',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: ClaimStatus.VERIFIED
      },
      {
        id: '2',
        type: 'KYCVerification',
        value: 'PASSED',
        issuer: 'did:ethr:0xabcdef1234567890abcdef1234567890abcdef12',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        signature: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        status: ClaimStatus.VERIFIED,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        type: 'AddressVerification',
        value: 'PENDING',
        issuer: 'did:ethr:0x7890abcdef1234567890abcdef1234567890abcd',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        signature: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        status: ClaimStatus.PENDING
      }
    ];
  }

  async getReputation(did: string): Promise<number> {
    // In a real implementation, this would fetch reputation from a blockchain or decentralized network
    // For this demo, we're generating mock data
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock reputation score (0-100)
    return Math.floor(Math.random() * 100);
  }

  private checkRateLimit(action: string): void {
    const now = Date.now();
    
    switch (action) {
      case 'connect':
        if (now - this.lastConnectionTime < this.connectionCooldown) {
          console.warn('[SECURITY] Rate limit exceeded for wallet connection');
          throw new Error('Please wait a moment before trying to connect again');
        }
        this.lastConnectionTime = now;
        break;
        
      default:
        // For other actions like identity fetches
        if (action.startsWith('identity_')) {
          const lastFetch = this.lastIdentityFetch[action] || 0;
          if (now - lastFetch < this.fetchCooldown) {
            console.warn(`[SECURITY] Rate limit exceeded for ${action}`);
            throw new Error('Please wait a moment before fetching again');
          }
          this.lastIdentityFetch[action] = now;
        }
        break;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) {
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
      const signature = await this.wallet.signMessage(sanitizedMessage);

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
    if (!this.wallet) {
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
      const tx = await this.wallet.sendTransaction(transaction);

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
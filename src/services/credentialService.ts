import { ethers } from 'ethers';
import { Buffer } from 'buffer';
import * as didJWT from 'did-jwt';
import { 
  VerifiableCredential, 
  CredentialSubject, 
  KYCCredentialSubject, 
  CredentialType,
  EncryptedCredential,
  CredentialRequest,
  SelectiveDisclosure
} from '../types/credentials';
import { ClaimStatus } from '../types/identity';

/**
 * Service for managing decentralized identity credentials
 */
class CredentialService {
  private wallet: ethers.Wallet | null = null;
  private encryptionKey: CryptoKey | null = null;
  private credentials: Map<string, EncryptedCredential> = new Map();
  private pendingRequests: CredentialRequest[] = [];

  /**
   * Initialize the credential service with a wallet
   */
  async initialize(privateKey: string): Promise<boolean> {
    try {
      // Set up wallet for signing
      this.wallet = new ethers.Wallet(privateKey);
      
      // Generate encryption key for credential storage
      this.encryptionKey = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      return true;
    } catch (error) {
      console.error('Failed to initialize credential service:', error);
      return false;
    }
  }

  /**
   * Get the DID associated with the current wallet
   */
  getDID(): string {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    // Create a simple ethr-did format
    return `did:ethr:${this.wallet.address.toLowerCase()}`;
  }

  /**
   * Issue a new verifiable credential
   */
  async issueCredential<T extends CredentialSubject>(
    subject: T,
    expirationDate?: Date
  ): Promise<VerifiableCredential<T>> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const did = this.getDID();
    const now = new Date();
    const id = `urn:uuid:${crypto.randomUUID()}`;
    
    // Create the credential
    const credential: VerifiableCredential<T> = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      id,
      type: ['VerifiableCredential', subject.type],
      issuer: {
        id: did,
        name: 'Self-Issued'
      },
      issuanceDate: now.toISOString(),
      expirationDate: expirationDate ? expirationDate.toISOString() : undefined,
      credentialSubject: {
        ...subject,
        id: did
      },
      credentialStatus: {
        id: `https://kyc.example.com/credentials/${id}/status`,
        type: 'CredentialStatusList2021',
        status: ClaimStatus.VERIFIED
      },
      proof: {
        type: 'EthereumECDSASignature2019',
        created: now.toISOString(),
        verificationMethod: `${did}#keys-1`,
        proofPurpose: 'assertionMethod',
        proofValue: '' // To be filled below
      }
    };

    // Create and add signature
    const message = JSON.stringify({
      '@context': credential['@context'],
      id: credential.id,
      type: credential.type,
      issuer: credential.issuer,
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      credentialSubject: credential.credentialSubject,
      credentialStatus: credential.credentialStatus
    });
    
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
    const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));
    credential.proof.proofValue = signature;

    // Store the credential
    await this.storeCredential(credential);
    
    return credential;
  }

  /**
   * Store a credential securely
   */
  private async storeCredential<T extends CredentialSubject>(
    credential: VerifiableCredential<T>
  ): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      // Encrypt the credential
      const data = JSON.stringify(credential);
      const encodedData = new TextEncoder().encode(data);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.encryptionKey,
        encodedData
      );
      
      // Convert to base64 for storage
      const encryptedBase64 = Buffer.from(
        new Uint8Array(encryptedData)
      ).toString('base64');
      
      const ivBase64 = Buffer.from(iv).toString('base64');
      
      // Create storage format
      const credentialType = Array.isArray(credential.type) && credential.type.length > 1
        ? credential.type[1] as CredentialType
        : CredentialType.IDENTITY;
        
      const encryptedCredential: EncryptedCredential = {
        id: credential.id,
        type: credentialType,
        encryptedData: `${ivBase64}.${encryptedBase64}`,
        encryptionMethod: 'AES-GCM',
        publicMetadata: {
          issuer: credential.issuer.id,
          issuanceDate: credential.issuanceDate,
          expirationDate: credential.expirationDate,
          credentialType: credentialType,
          status: credential.credentialStatus.status
        }
      };
      
      // Store in memory (would be persisted in a real implementation)
      this.credentials.set(credential.id, encryptedCredential);
      
      // In a real implementation, we would also:
      // 1. Store encrypted credentials locally (IndexedDB)
      // 2. Optionally backup to decentralized storage (IPFS)
      // 3. Store reference/hash on chain for verification
      
    } catch (error) {
      console.error('Failed to store credential:', error);
      throw new Error('Failed to store credential securely');
    }
  }

  /**
   * Retrieve a credential by ID
   */
  async getCredential<T extends CredentialSubject>(id: string): Promise<VerifiableCredential<T> | null> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    
    const encryptedCredential = this.credentials.get(id);
    if (!encryptedCredential) {
      return null;
    }
    
    try {
      // Decrypt the credential
      const [ivBase64, dataBase64] = encryptedCredential.encryptedData.split('.');
      const iv = Buffer.from(ivBase64, 'base64');
      const encryptedData = Buffer.from(dataBase64, 'base64');
      
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.encryptionKey,
        encryptedData
      );
      
      const decodedData = new TextDecoder().decode(decryptedData);
      return JSON.parse(decodedData) as VerifiableCredential<T>;
      
    } catch (error) {
      console.error('Failed to decrypt credential:', error);
      return null;
    }
  }

  /**
   * Get all credential metadata (without exposing sensitive data)
   */
  getAllCredentialMetadata(): Array<{id: string, metadata: any}> {
    return Array.from(this.credentials.entries()).map(([id, credential]) => ({
      id,
      metadata: credential.publicMetadata
    }));
  }

  /**
   * Verify a credential's authenticity
   */
  async verifyCredential<T extends CredentialSubject>(
    credential: VerifiableCredential<T>
  ): Promise<boolean> {
    try {
      // 1. Check if expired
      if (credential.expirationDate) {
        const expiry = new Date(credential.expirationDate);
        if (expiry < new Date()) {
          return false;
        }
      }
      
      // 2. Verify signature
      const message = JSON.stringify({
        '@context': credential['@context'],
        id: credential.id,
        type: credential.type,
        issuer: credential.issuer,
        issuanceDate: credential.issuanceDate,
        expirationDate: credential.expirationDate,
        credentialSubject: credential.credentialSubject,
        credentialStatus: credential.credentialStatus
      });
      
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
      
      // Extract address from signature
      const recoveredAddress = ethers.verifyMessage(
        ethers.getBytes(messageHash),
        credential.proof.proofValue
      );
      
      // Extract issuer address from DID
      const issuerDid = credential.issuer.id;
      let issuerAddress = issuerDid;
      
      if (issuerDid.startsWith('did:ethr:')) {
        issuerAddress = issuerDid.split(':')[2];
      }
      
      // Compare addresses (case-insensitive)
      return recoveredAddress.toLowerCase() === issuerAddress.toLowerCase();
      
    } catch (error) {
      console.error('Error verifying credential:', error);
      return false;
    }
  }

  /**
   * Create a selective disclosure of credential fields
   */
  async createSelectiveDisclosure(
    credentialId: string,
    recipientDid: string,
    fields: string[],
    purpose: string,
    expiry: Date
  ): Promise<SelectiveDisclosure | null> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      // Get the credential
      const credential = await this.getCredential(credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }
      
      // Verify it's still valid
      const isValid = await this.verifyCredential(credential);
      if (!isValid) {
        throw new Error('Cannot disclose an invalid credential');
      }
      
      // Extract only the requested fields
      const disclosedData: Record<string, any> = {};
      
      for (const field of fields) {
        const keys = field.split('.');
        let value: any = credential.credentialSubject;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            value = undefined;
            break;
          }
        }
        
        if (value !== undefined) {
          // Set nested path
          let target = disclosedData;
          for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in target)) {
              target[key] = {};
            }
            target = target[key];
          }
          target[keys[keys.length - 1]] = value;
        }
      }
      
      // Create a disclosure object
      const disclosure: SelectiveDisclosure = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        credentialId: credentialId,
        recipientDid: recipientDid,
        disclosedFields: fields,
        purpose: purpose,
        expiresAt: expiry.toISOString(),
        proof: '' // To be filled
      };
      
      // Sign the disclosure
      const message = JSON.stringify({
        id: disclosure.id,
        credentialId: disclosure.credentialId,
        recipientDid: disclosure.recipientDid,
        fields: disclosure.disclosedFields,
        purpose: disclosure.purpose,
        expiresAt: disclosure.expiresAt,
        data: disclosedData
      });
      
      const signature = await this.wallet.signMessage(message);
      disclosure.proof = signature;
      
      return disclosure;
      
    } catch (error) {
      console.error('Error creating selective disclosure:', error);
      return null;
    }
  }

  /**
   * Handle an incoming credential request
   */
  async receiveCredentialRequest(request: CredentialRequest): Promise<void> {
    // Validate request
    if (new Date(request.expiresAt) < new Date()) {
      throw new Error('Credential request has expired');
    }
    
    // Store the request
    this.pendingRequests.push(request);
  }

  /**
   * Get all pending credential requests
   */
  getPendingRequests(): CredentialRequest[] {
    // Filter out expired requests
    return this.pendingRequests.filter(request => {
      return new Date(request.expiresAt) >= new Date() && 
             request.status === 'pending';
    });
  }

  /**
   * Respond to a credential request
   */
  async respondToRequest(
    requestId: string, 
    approved: boolean, 
    disclosures?: SelectiveDisclosure[]
  ): Promise<boolean> {
    const requestIndex = this.pendingRequests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
      throw new Error('Request not found');
    }
    
    const request = this.pendingRequests[requestIndex];
    request.status = approved ? 'approved' : 'denied';
    
    if (approved && disclosures && request.callbackUrl) {
      try {
        // In a real implementation, send the response to the callback URL
        console.log(`Would send response to ${request.callbackUrl}`, { 
          requestId,
          approved,
          disclosures
        });
        
        // Simulate successful response
        return true;
      } catch (error) {
        console.error('Failed to send response:', error);
        return false;
      }
    }
    
    return true;
  }
}

export const credentialService = new CredentialService();
export default credentialService; 
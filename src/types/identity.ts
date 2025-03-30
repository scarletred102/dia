export enum ClaimStatus {
  VERIFIED = 'VERIFIED',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED'
}

export interface Claim {
  id: string;
  type: string;
  value: string;
  issuer: string;
  timestamp: number;
  signature: string;
  status: ClaimStatus;
  expiresAt?: number;
}

export interface Identity {
  did: string;
  address: string;
  reputation: number;
  claims: Claim[];
  lastUpdated: number;
}

export interface IdentityState {
  identity: Identity | null;
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;
  lastSync: number | null;
}

export interface BlockchainIdentityService {
  getIdentity(address: string): Promise<Identity>;
  getClaims(did: string): Promise<Claim[]>;
  getReputation(address: string): Promise<number>;
  verifyClaim(claim: Claim): Promise<boolean>;
}
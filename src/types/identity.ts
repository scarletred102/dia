export interface Identity {
  did: string;
  address: string;
  reputation: number;
  claims: Claim[];
  lastUpdated?: number;
}

export interface Claim {
  id: string;
  type: ClaimType;
  value: string;
  issuer: string;
  timestamp: number;
  signature: string;
  status: ClaimStatus;
  expiresAt?: number;
}

export enum ClaimType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  KYC_VERIFICATION = 'KYC_VERIFICATION',
  PROFESSIONAL_CREDENTIAL = 'PROFESSIONAL_CREDENTIAL',
  EDUCATION_CREDENTIAL = 'EDUCATION_CREDENTIAL',
}

export enum ClaimStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
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
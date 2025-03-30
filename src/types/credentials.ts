import { ClaimStatus } from './identity';

/**
 * Credential types based on W3C Verifiable Credentials Data Model
 */
export enum CredentialType {
  IDENTITY = 'IdentityCredential',
  KYC = 'KYCCredential',
  EDUCATION = 'EducationCredential',
  EMPLOYMENT = 'EmploymentCredential',
  FINANCE = 'FinancialCredential',
  HEALTH = 'HealthCredential',
  MEMBERSHIP = 'MembershipCredential',
  CERTIFICATION = 'CertificationCredential',
  GOVERNMENT = 'GovernmentCredential',
}

/**
 * Identity verification levels
 */
export enum VerificationLevel {
  BASIC = 'basic',      // Email/Phone verification
  STANDARD = 'standard', // Document verification
  ADVANCED = 'advanced', // Document + facial biometrics
  EXPERT = 'expert',    // Document + biometrics + additional checks
}

/**
 * Supported identity document types
 */
export enum DocumentType {
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'drivingLicense',
  NATIONAL_ID = 'nationalId',
  RESIDENCE_PERMIT = 'residencePermit',
  UTILITY_BILL = 'utilityBill',
  BANK_STATEMENT = 'bankStatement',
}

/**
 * Verification method used
 */
export enum VerificationMethod {
  DOCUMENT_SCAN = 'documentScan',
  FACIAL_RECOGNITION = 'facialRecognition',
  LIVENESS_CHECK = 'livenessCheck',
  VIDEO_INTERVIEW = 'videoInterview',
  PROOF_OF_ADDRESS = 'proofOfAddress',
  BACKGROUND_CHECK = 'backgroundCheck',
}

/**
 * Base interface for all credential subjects
 */
export interface CredentialSubject {
  id: string; // DID of the subject
  type: string;
  issuanceDate: string;
  expirationDate?: string;
}

/**
 * KYC Credential Subject containing verification details
 */
export interface KYCCredentialSubject extends CredentialSubject {
  type: CredentialType.KYC;
  name: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  dateOfBirth: string; // ISO 8601 format
  nationality: string; // ISO 3166-1 alpha-3 country code
  residenceCountry: string; // ISO 3166-1 alpha-3 country code
  verificationLevel: VerificationLevel;
  verificationMethods: VerificationMethod[];
  documentType: DocumentType;
  documentNumber: string; // Encrypted or hashed
  documentIssuer: string;
  documentIssuanceDate: string;
  documentExpiryDate: string;
  proofOfAddressType?: DocumentType;
  lastVerifiedDate: string;
}

/**
 * VerifiableCredential following W3C standard structure
 */
export interface VerifiableCredential<T extends CredentialSubject> {
  '@context': string[]; // JSON-LD contexts
  id: string; // Unique credential identifier
  type: string[];
  issuer: {
    id: string; // DID of the issuer
    name?: string;
  };
  issuanceDate: string; // ISO 8601 format
  expirationDate?: string; // ISO 8601 format
  credentialSubject: T;
  credentialStatus: {
    id: string; // URL or blockchain reference for checking status
    type: string; // Type of status check method
    status: ClaimStatus;
  };
  proof: {
    type: string; // Proof type, e.g., "Ed25519Signature2020"
    created: string; // ISO 8601 format
    verificationMethod: string; // URI to the verification key
    proofPurpose: string; // e.g., "assertionMethod"
    proofValue: string; // The signature value
  };
}

/**
 * A KYC Verifiable Credential
 */
export type KYCVerifiableCredential = VerifiableCredential<KYCCredentialSubject>;

/**
 * Credential storage with encryption metadata
 */
export interface EncryptedCredential {
  id: string;
  type: CredentialType;
  encryptedData: string; // Encrypted verifiable credential
  encryptionMethod: string;
  publicMetadata: {
    issuer: string;
    issuanceDate: string;
    expirationDate?: string;
    credentialType: CredentialType;
    status: ClaimStatus;
  };
}

/**
 * Credential request from a service
 */
export interface CredentialRequest {
  id: string;
  requesterDid: string;
  requesterName: string;
  requestDate: string;
  credentialTypes: CredentialType[];
  requiredFields: string[];
  purpose: string;
  expiresAt: string;
  callbackUrl?: string;
  status: 'pending' | 'approved' | 'denied';
}

/**
 * Selective disclosure of credentials
 */
export interface SelectiveDisclosure {
  id: string;
  credentialId: string;
  recipientDid: string;
  disclosedFields: string[];
  purpose: string;
  expiresAt: string;
  proof: string; // Zero-knowledge proof or signed attestation
} 
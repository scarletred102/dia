import { useState, useEffect, useCallback } from 'react';
import credentialService from '../services/credentialService';
import { useWeb3Identity } from './useWeb3Identity';
import { 
  VerifiableCredential,
  CredentialSubject,
  KYCCredentialSubject,
  CredentialType,
  CredentialRequest,
  SelectiveDisclosure
} from '../types/credentials';

/**
 * Hook for managing credentials
 */
export function useCredentials() {
  const { state: identityState } = useWeb3Identity();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Array<{id: string, metadata: any}>>([]);
  const [pendingRequests, setPendingRequests] = useState<CredentialRequest[]>([]);

  // Initialize credential service when wallet is connected
  useEffect(() => {
    async function initializeCredentialService() {
      if (identityState.wallet && identityState.privateKey) {
        try {
          setIsLoading(true);
          const success = await credentialService.initialize(identityState.privateKey);
          if (success) {
            setIsInitialized(true);
            // Load credential metadata
            const metadata = credentialService.getAllCredentialMetadata();
            setCredentials(metadata);
            // Load pending requests
            const requests = credentialService.getPendingRequests();
            setPendingRequests(requests);
          } else {
            setError('Failed to initialize credential service');
          }
        } catch (err) {
          setError(`Error initializing credential service: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsInitialized(false);
        setCredentials([]);
        setPendingRequests([]);
      }
    }

    initializeCredentialService();
  }, [identityState.wallet, identityState.privateKey]);

  // Refresh credential metadata
  const refreshCredentials = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      setIsLoading(true);
      const metadata = credentialService.getAllCredentialMetadata();
      setCredentials(metadata);
      const requests = credentialService.getPendingRequests();
      setPendingRequests(requests);
      setError(null);
    } catch (err) {
      setError(`Error refreshing credentials: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Get a specific credential by ID
  const getCredential = useCallback(async <T extends CredentialSubject>(
    id: string
  ): Promise<VerifiableCredential<T> | null> => {
    if (!isInitialized) {
      setError('Credential service not initialized');
      return null;
    }
    
    try {
      setIsLoading(true);
      const credential = await credentialService.getCredential<T>(id);
      return credential;
    } catch (err) {
      setError(`Error retrieving credential: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Issue a new KYC credential (self-attested for demonstration)
  const issueKYCCredential = useCallback(async (
    kycData: Omit<KYCCredentialSubject, 'id' | 'issuanceDate' | 'type'>,
    expirationDate?: Date
  ): Promise<boolean> => {
    if (!isInitialized) {
      setError('Credential service not initialized');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Create subject data
      const subject: KYCCredentialSubject = {
        ...kycData,
        id: '', // Will be set by the service
        type: CredentialType.KYC,
        issuanceDate: new Date().toISOString(),
      };
      
      // Issue the credential
      await credentialService.issueCredential<KYCCredentialSubject>(
        subject,
        expirationDate
      );
      
      // Refresh the credential list
      await refreshCredentials();
      
      return true;
    } catch (err) {
      setError(`Error issuing credential: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, refreshCredentials]);

  // Verify a credential
  const verifyCredential = useCallback(async <T extends CredentialSubject>(
    credential: VerifiableCredential<T>
  ): Promise<boolean> => {
    if (!isInitialized) {
      setError('Credential service not initialized');
      return false;
    }
    
    try {
      setIsLoading(true);
      const isValid = await credentialService.verifyCredential(credential);
      return isValid;
    } catch (err) {
      setError(`Error verifying credential: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Create a selective disclosure for a service provider
  const createDisclosure = useCallback(async (
    credentialId: string,
    recipientDid: string,
    fields: string[],
    purpose: string,
    expiryDays: number = 1
  ): Promise<SelectiveDisclosure | null> => {
    if (!isInitialized) {
      setError('Credential service not initialized');
      return null;
    }
    
    try {
      setIsLoading(true);
      
      // Calculate expiry date
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expiryDays);
      
      // Create the disclosure
      const disclosure = await credentialService.createSelectiveDisclosure(
        credentialId,
        recipientDid,
        fields,
        purpose,
        expiry
      );
      
      return disclosure;
    } catch (err) {
      setError(`Error creating disclosure: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Handle an incoming credential request
  const handleCredentialRequest = useCallback(async (
    request: CredentialRequest
  ): Promise<boolean> => {
    if (!isInitialized) {
      setError('Credential service not initialized');
      return false;
    }
    
    try {
      setIsLoading(true);
      await credentialService.receiveCredentialRequest(request);
      await refreshCredentials();
      return true;
    } catch (err) {
      setError(`Error handling credential request: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, refreshCredentials]);

  // Respond to a credential request
  const respondToRequest = useCallback(async (
    requestId: string,
    approved: boolean,
    disclosures?: SelectiveDisclosure[]
  ): Promise<boolean> => {
    if (!isInitialized) {
      setError('Credential service not initialized');
      return false;
    }
    
    try {
      setIsLoading(true);
      const success = await credentialService.respondToRequest(
        requestId,
        approved,
        disclosures
      );
      
      // Refresh the request list
      await refreshCredentials();
      
      return success;
    } catch (err) {
      setError(`Error responding to request: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, refreshCredentials]);

  return {
    isInitialized,
    isLoading,
    error,
    credentials,
    pendingRequests,
    getDID: isInitialized ? credentialService.getDID : () => '',
    refreshCredentials,
    getCredential,
    issueKYCCredential,
    verifyCredential,
    createDisclosure,
    handleCredentialRequest,
    respondToRequest,
  };
} 
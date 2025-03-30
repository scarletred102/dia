import { useState, useEffect, useCallback } from 'react';
import { Identity } from '../types/identity';
import { secureWeb3Service } from '../services/secureWeb3Service';

interface IdentityState {
  identity: Identity | null;
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWeb3Identity() {
  const [state, setState] = useState<IdentityState>({
    identity: null,
    isConnecting: false,
    isLoading: false,
    error: null,
  });

  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      setState(prev => ({ ...prev, identity: null }));
    } else {
      try {
        const identity = await secureWeb3Service.getIdentity(accounts[0]);
        setState(prev => ({ ...prev, identity }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load identity'
        }));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [handleAccountsChanged]);

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const address = await secureWeb3Service.connect();
      const identity = await secureWeb3Service.getIdentity(address);
      setState(prev => ({
        ...prev,
        identity,
        isConnecting: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }));
    }
  };

  const disconnect = async () => {
    await secureWeb3Service.disconnect();
    setState(prev => ({
      ...prev,
      identity: null,
      error: null,
    }));
  };

  const syncIdentity = async () => {
    if (!state.identity) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const identity = await secureWeb3Service.getIdentity(state.identity.address);
      setState(prev => ({
        ...prev,
        identity,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sync identity'
      }));
    }
  };

  return {
    ...state,
    connectWallet,
    disconnect,
    syncIdentity,
  };
}
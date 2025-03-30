import { useState, useEffect, useCallback, useRef } from 'react';
import { Identity, IdentityState } from '../types/identity';
import { blockchainService } from '../services/blockchainService';

export const useWeb3Identity = () => {
  const [state, setState] = useState<IdentityState>({
    identity: null,
    isConnecting: false,
    isLoading: false,
    error: null,
    lastSync: null,
  });

  const syncTimeoutRef = useRef<number>();

  const syncIdentity = useCallback(async (address: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const identity = await blockchainService.getIdentity(address);
      setState(prev => ({
        ...prev,
        identity,
        isLoading: false,
        lastSync: Date.now(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to sync identity data',
        isLoading: false,
      }));
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'Please install MetaMask!' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      await syncIdentity(address);
      
      // Set up periodic sync
      syncTimeoutRef.current = window.setInterval(() => {
        syncIdentity(address);
      }, 30000); // Sync every 30 seconds

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to connect wallet',
        isConnecting: false 
      }));
    }
  }, [syncIdentity]);

  const disconnect = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearInterval(syncTimeoutRef.current);
    }
    setState({
      identity: null,
      isConnecting: false,
      isLoading: false,
      error: null,
      lastSync: null,
    });
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', disconnect);
      window.ethereum.on('chainChanged', disconnect);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', disconnect);
        window.ethereum.removeListener('chainChanged', disconnect);
      }
    };
  }, [disconnect]);

  return {
    ...state,
    connectWallet,
    disconnect,
    syncIdentity: state.identity ? () => syncIdentity(state.identity.address) : null,
  };
};
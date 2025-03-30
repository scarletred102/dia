import { useState, useEffect, useCallback } from 'react';
import { Identity } from '../types/identity';
import { secureWeb3Service } from '../services/secureWeb3Service';

interface IdentityState {
  wallet: any | null;
  privateKey: string | null;
  identity: Identity | null;
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;
  lastSynced: Date | null;
}

export function useWeb3Identity() {
  const [state, setState] = useState<IdentityState>({
    wallet: null,
    privateKey: null,
    identity: null,
    isConnecting: false,
    isLoading: false,
    error: null,
    lastSynced: null
  });

  // Sync identity from blockchain
  const syncIdentity = useCallback(async () => {
    if (!state.wallet) {
      setState(prevState => ({
        ...prevState,
        error: 'Wallet not connected'
      }));
      return;
    }

    try {
      setState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null
      }));

      const address = state.wallet.address;
      const identity = await secureWeb3Service.getIdentity(address);

      setState(prevState => ({
        ...prevState,
        identity,
        isLoading: false,
        lastSynced: new Date()
      }));
    } catch (error) {
      console.error('Error syncing identity:', error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: `Failed to sync identity: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, [state.wallet]);

  // Connect to wallet
  const connectWallet = useCallback(async () => {
    try {
      setState(prevState => ({
        ...prevState,
        isConnecting: true,
        error: null
      }));

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Connect to wallet using secure service
      const walletConnection = await secureWeb3Service.connectWallet();
      
      if (!walletConnection || !walletConnection.wallet) {
        throw new Error('Failed to connect to wallet');
      }
      
      setState(prevState => ({
        ...prevState,
        wallet: walletConnection.wallet,
        privateKey: walletConnection.privateKey || null,
        isConnecting: false
      }));

      // Sync identity after connection
      await syncIdentity();
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setState(prevState => ({
        ...prevState,
        isConnecting: false,
        error: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, [syncIdentity]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await secureWeb3Service.disconnect();
      
      setState({
        wallet: null,
        privateKey: null,
        identity: null,
        isConnecting: false,
        isLoading: false,
        error: null,
        lastSynced: null
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setState(prevState => ({
        ...prevState,
        error: `Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, []);

  // Set up event listeners for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnect();
        } else if (state.wallet && accounts[0] !== state.wallet.address) {
          // User switched accounts
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // When chain changes, refresh the page as recommended by MetaMask
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [state.wallet, connectWallet, disconnect]);

  return {
    state,
    connectWallet,
    disconnect,
    syncIdentity
  };
}
import React from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { useWeb3Identity } from '../hooks/useWeb3Identity';
import { IdentityCard } from './IdentityCard';
import toast from 'react-hot-toast';

const WalletConnect: React.FC = () => {
  const { 
    identity, 
    isConnecting, 
    isLoading,
    error, 
    connectWallet, 
    disconnect,
    syncIdentity
  } = useWeb3Identity();

  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully');
    } catch (err) {
      toast.error('Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected successfully');
    } catch (err) {
      toast.error('Failed to disconnect wallet');
    }
  };

  const handleSync = async () => {
    try {
      await syncIdentity();
      toast.success('Identity synced successfully');
    } catch (err) {
      toast.error('Failed to sync identity');
    }
  };

  if (!identity) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`
          px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
          transform transition-all duration-200
          hover:bg-blue-700 active:scale-95
          flex items-center space-x-2
          ${isConnecting ? 'opacity-75 cursor-not-allowed' : ''}
        `}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting Wallet...</span>
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            <span>Connect Wallet</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <IdentityCard 
        identity={identity} 
        isLoading={isLoading}
        onSync={handleSync}
      />
      <button
        onClick={handleDisconnect}
        className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
};

export default WalletConnect; 
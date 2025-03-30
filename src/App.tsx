import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { useWeb3Identity } from './hooks/useWeb3Identity';
import { IdentityCard } from './components/IdentityCard';

function App() {
  const { 
    identity, 
    isConnecting, 
    isLoading,
    error, 
    connectWallet, 
    disconnect,
    syncIdentity
  } = useWeb3Identity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Shield className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Blockchain Digital Identity
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Secure, self-sovereign identity management with blockchain-based verification
              and reputation scoring.
            </p>
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center space-y-6">
            {error && (
              <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {!identity ? (
              <button
                onClick={connectWallet}
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
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connecting Wallet...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full flex flex-col items-center space-y-6">
                <IdentityCard 
                  identity={identity} 
                  isLoading={isLoading}
                  onSync={syncIdentity}
                />
                <button
                  onClick={disconnect}
                  className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
import React from 'react';
import { Toaster } from 'react-hot-toast';
import CredentialsDashboard from './components/CredentialsDashboard';
import { useWeb3Identity } from './hooks/useWeb3Identity';
import { SecurityErrorBoundary } from './components/SecurityErrorBoundary';

const Header = () => {
  const { state, connectWallet, disconnect } = useWeb3Identity();
  const { identity, isConnecting, isLoading } = state;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h1 className="text-xl font-semibold text-gray-800">Web3 Digital Identity</h1>
        </div>
        
        <div>
          {identity ? (
            <div className="flex items-center">
              <div className="mr-4 text-sm hidden md:block">
                <div className="text-gray-500">Connected as</div>
                <div className="font-mono text-gray-800 truncate" style={{ maxWidth: '200px' }}>
                  {identity.address}
                </div>
              </div>
              <button 
                onClick={disconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              disabled={isConnecting || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-100 mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 text-sm mb-2 md:mb-0">
            &copy; {new Date().getFullYear()} Web3 Digital Identity. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Terms of Service</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

function App() {
  return (
    <SecurityErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Header />
        <main className="flex-grow py-6">
          <CredentialsDashboard />
        </main>
        <Footer />
      </div>
    </SecurityErrorBoundary>
  );
}

export default App;
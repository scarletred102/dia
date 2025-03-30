import React, { Suspense, lazy } from 'react';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';

// Lazy load components
const IdentityCard = lazy(() => import('./components/IdentityCard'));
const WalletConnect = lazy(() => import('./components/WalletConnect'));

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);

// Loading Component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
              <Suspense fallback={<LoadingFallback />}>
                <WalletConnect />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useCredentials } from '../hooks/useCredentials';
import CredentialCard from './CredentialCard';
import { CredentialType } from '../types/credentials';
import KYCForm from './KYCForm';
import CredentialDetails from './CredentialDetails';
import ShareCredentialModal from './ShareCredentialModal';

const CredentialsDashboard: React.FC = () => {
  const {
    isInitialized,
    isLoading,
    error,
    credentials,
    refreshCredentials,
    getCredential,
  } = useCredentials();

  const [isKYCFormOpen, setIsKYCFormOpen] = useState(false);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handle credential refreshing
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCredentials();
    setTimeout(() => setRefreshing(false), 1000); // Add delay to show loading state
  };

  // Handle credential viewing
  const handleViewCredential = async (id: string) => {
    setSelectedCredentialId(id);
    const credential = await getCredential(id);
    setSelectedCredential(credential);
    setIsViewModalOpen(true);
  };

  // Handle credential sharing
  const handleShareCredential = async (id: string) => {
    setSelectedCredentialId(id);
    const credential = await getCredential(id);
    setSelectedCredential(credential);
    setIsShareModalOpen(true);
  };

  // Close all modals
  const closeAllModals = () => {
    setIsKYCFormOpen(false);
    setIsViewModalOpen(false);
    setIsShareModalOpen(false);
    setSelectedCredentialId(null);
    setSelectedCredential(null);
  };

  if (!isInitialized) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-4">Wallet Not Connected</h2>
        <p className="text-gray-600">
          Connect your wallet to manage your digital identity credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Credentials</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsKYCFormOpen(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add KYC</span>
          </button>
        </div>
      </div>

      {isLoading && !refreshing ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : credentials.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No Credentials Found</h3>
          <p className="text-gray-600 mb-4">
            You don't have any credentials yet. Add a KYC credential to get started.
          </p>
          <button
            onClick={() => setIsKYCFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add KYC Credential
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((cred) => (
            <CredentialCard
              key={cred.id}
              credentialId={cred.id}
              metadata={cred.metadata}
              onView={handleViewCredential}
              onShare={handleShareCredential}
            />
          ))}
        </div>
      )}

      {/* KYC Form Modal */}
      {isKYCFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-90vh overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Add KYC Credential</h2>
            </div>
            <KYCForm
              onSubmit={() => {
                closeAllModals();
                refreshCredentials();
              }}
              onCancel={closeAllModals}
            />
          </div>
        </div>
      )}

      {/* View Credential Modal */}
      {isViewModalOpen && selectedCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-90vh overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Credential Details</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CredentialDetails credential={selectedCredential} />
          </div>
        </div>
      )}

      {/* Share Credential Modal */}
      {isShareModalOpen && selectedCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-90vh overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Share Credential</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ShareCredentialModal
              credential={selectedCredential}
              onClose={closeAllModals}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialsDashboard; 
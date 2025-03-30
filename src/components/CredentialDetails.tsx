import React, { useState } from 'react';
import { useCredentials } from '../hooks/useCredentials';
import { VerifiableCredential, CredentialSubject, CredentialType } from '../types/credentials';
import { ClaimStatus } from '../types/identity';
import { Check, AlertTriangle, Copy, CheckCircle } from 'lucide-react';

interface CredentialDetailsProps {
  credential: VerifiableCredential<CredentialSubject>;
}

const CredentialDetails: React.FC<CredentialDetailsProps> = ({ credential }) => {
  const { verifyCredential } = useCredentials();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Handle credential verification
  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const isValid = await verifyCredential(credential);
      setVerified(isValid);
    } catch (error) {
      setVerified(false);
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle copying to clipboard
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // Format ISO date to locale string
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if credential is expired
  const isExpired = () => {
    if (!credential.expirationDate) return false;
    return new Date(credential.expirationDate) < new Date();
  };

  // Check credential status
  const getStatusInfo = () => {
    if (isExpired()) {
      return {
        label: 'Expired',
        color: 'text-red-500 bg-red-50',
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    }

    const status = credential.credentialStatus.status;
    switch (status) {
      case ClaimStatus.VERIFIED:
        return {
          label: 'Verified',
          color: 'text-green-500 bg-green-50',
          icon: <Check className="w-4 h-4" />,
        };
      case ClaimStatus.PENDING:
        return {
          label: 'Pending',
          color: 'text-yellow-500 bg-yellow-50',
          icon: <AlertTriangle className="w-4 h-4" />,
        };
      case ClaimStatus.REVOKED:
        return {
          label: 'Revoked',
          color: 'text-red-500 bg-red-50',
          icon: <AlertTriangle className="w-4 h-4" />,
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-500 bg-gray-50',
          icon: <AlertTriangle className="w-4 h-4" />,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="p-4">
      {/* Header with verification status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
            >
              {statusInfo.icon}
              <span className="ml-1">{statusInfo.label}</span>
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {isExpired() ? 'This credential has expired' : ''}
            </span>
          </div>
          
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying
              </>
            ) : (
              'Verify'
            )}
          </button>
        </div>
        
        {verified !== null && (
          <div className={`mt-2 p-3 rounded-md ${verified ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {verified ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${verified ? 'text-green-800' : 'text-red-800'}`}>
                  {verified ? 'Credential verified successfully' : 'Credential verification failed'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credential metadata */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Credential Information</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">ID</p>
              <div className="mt-1 flex items-center">
                <p className="text-sm text-gray-900 font-mono truncate">{credential.id}</p>
                <button
                  onClick={() => handleCopy(credential.id, 'id')}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  {copied === 'id' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p className="mt-1 text-sm text-gray-900">
                {credential.type.filter(t => t !== 'VerifiableCredential').join(', ')}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Issuer</p>
              <div className="mt-1 flex items-center">
                <p className="text-sm text-gray-900 font-mono truncate">{credential.issuer.id}</p>
                <button
                  onClick={() => handleCopy(credential.issuer.id, 'issuer')}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  {copied === 'issuer' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {credential.issuer.name && (
                <p className="mt-1 text-sm text-gray-500">{credential.issuer.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Issuance Date</p>
                <p className="mt-1 text-sm text-gray-900">{formatDate(credential.issuanceDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expiration Date</p>
                <p className="mt-1 text-sm text-gray-900">
                  {credential.expirationDate ? formatDate(credential.expirationDate) : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credential subject data */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Credential Data</h3>
        <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
          <pre className="text-xs text-gray-800 font-mono">
            {JSON.stringify(credential.credentialSubject, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CredentialDetails; 
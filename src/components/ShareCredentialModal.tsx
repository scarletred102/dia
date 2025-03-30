import React, { useState } from 'react';
import { useCredentials } from '../hooks/useCredentials';
import { VerifiableCredential, CredentialSubject, SelectiveDisclosure } from '../types/credentials';
import { QrCode, Copy, CheckCircle, Share2 } from 'lucide-react';

interface ShareCredentialModalProps {
  credential: VerifiableCredential<CredentialSubject>;
  onClose: () => void;
}

const ShareCredentialModal: React.FC<ShareCredentialModalProps> = ({ credential, onClose }) => {
  const { createDisclosure } = useCredentials();
  const [recipientDid, setRecipientDid] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiryDays, setExpiryDays] = useState(1);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [disclosure, setDisclosure] = useState<SelectiveDisclosure | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract fields from credential subject
  const extractFields = (obj: any, prefix = ''): string[] => {
    return Object.keys(obj).reduce((acc: string[], key) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        return [...acc, ...extractFields(obj[key], currentPath)];
      }
      return [...acc, currentPath];
    }, []);
  };

  // Get all fields from the credential subject
  const availableFields = extractFields(credential.credentialSubject);

  // Toggle field selection
  const toggleField = (field: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Check if at least one field is selected
  const hasSelectedFields = Object.values(selectedFields).some(value => value);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!recipientDid) {
      setError('Recipient DID is required');
      return;
    }
    
    if (!purpose) {
      setError('Purpose is required');
      return;
    }
    
    if (!hasSelectedFields) {
      setError('Select at least one field to share');
      return;
    }
    
    const fieldsToShare = Object.entries(selectedFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);
    
    setIsLoading(true);
    try {
      const result = await createDisclosure(
        credential.id,
        recipientDid,
        fieldsToShare,
        purpose,
        expiryDays
      );
      
      if (result) {
        setDisclosure(result);
      } else {
        setError('Failed to create disclosure');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy disclosure to clipboard
  const copyToClipboard = () => {
    if (!disclosure) return;
    
    const disclosureData = JSON.stringify(disclosure, null, 2);
    navigator.clipboard.writeText(disclosureData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4">
      {!disclosure ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient DID *
            </label>
            <input
              type="text"
              value={recipientDid}
              onChange={(e) => setRecipientDid(e.target.value)}
              placeholder="did:ethr:0x..."
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose *
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., KYC verification for service access"
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry (days)
            </label>
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value))}
              min="1"
              max="365"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Fields to Share *
            </label>
            <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
              {availableFields.map((field) => (
                <div key={field} className="mb-2 last:mb-0">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFields[field] || false}
                      onChange={() => toggleField(field)}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900 font-mono">{field}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-5 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading || !hasSelectedFields}
            >
              {isLoading ? 'Creating...' : 'Create Disclosure'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center">
          <div className="bg-gray-50 p-6 rounded-lg mb-6 w-full max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <QrCode className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-center mb-2">Selective Disclosure Created</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Share this disclosure with the recipient. It will expire in {expiryDays} day(s).
            </p>
            
            <div className="bg-gray-100 p-3 rounded-md mb-4 overflow-x-auto">
              <pre className="text-xs text-gray-800 font-mono">
                {JSON.stringify(disclosure, null, 2)}
              </pre>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareCredentialModal; 
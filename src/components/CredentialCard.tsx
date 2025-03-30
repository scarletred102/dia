import React, { useState } from 'react';
import { Shield, Clock, Check, X, Share2, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CredentialType, EncryptedCredential } from '../types/credentials';
import { ClaimStatus } from '../types/identity';

interface CredentialCardProps {
  credentialId: string;
  metadata: any;
  onView: (id: string) => void;
  onShare: (id: string) => void;
}

// Map credential types to friendly names
const credentialTypeNames: Record<CredentialType, string> = {
  [CredentialType.IDENTITY]: 'Identity',
  [CredentialType.KYC]: 'KYC Verification',
  [CredentialType.EDUCATION]: 'Education',
  [CredentialType.EMPLOYMENT]: 'Employment',
  [CredentialType.FINANCE]: 'Financial',
  [CredentialType.HEALTH]: 'Healthcare',
  [CredentialType.MEMBERSHIP]: 'Membership',
  [CredentialType.CERTIFICATION]: 'Certification',
  [CredentialType.GOVERNMENT]: 'Government ID',
};

// Color mapping for different credential types
const typeColors: Record<CredentialType, string> = {
  [CredentialType.IDENTITY]: 'bg-purple-600',
  [CredentialType.KYC]: 'bg-blue-600',
  [CredentialType.EDUCATION]: 'bg-green-600',
  [CredentialType.EMPLOYMENT]: 'bg-yellow-600',
  [CredentialType.FINANCE]: 'bg-red-600',
  [CredentialType.HEALTH]: 'bg-pink-600',
  [CredentialType.MEMBERSHIP]: 'bg-indigo-600',
  [CredentialType.CERTIFICATION]: 'bg-teal-600',
  [CredentialType.GOVERNMENT]: 'bg-gray-600',
};

// Status icons and colors
const statusConfig: Record<ClaimStatus, { icon: React.ReactNode; color: string }> = {
  [ClaimStatus.VERIFIED]: { 
    icon: <Check className="w-5 h-5" />, 
    color: 'text-green-500' 
  },
  [ClaimStatus.PENDING]: { 
    icon: <Clock className="w-5 h-5" />, 
    color: 'text-yellow-500' 
  },
  [ClaimStatus.EXPIRED]: { 
    icon: <X className="w-5 h-5" />, 
    color: 'text-red-500' 
  },
  [ClaimStatus.REVOKED]: { 
    icon: <X className="w-5 h-5" />, 
    color: 'text-red-500' 
  },
};

/**
 * CredentialCard component displays credential metadata and provides actions
 */
const CredentialCard: React.FC<CredentialCardProps> = ({ 
  credentialId, 
  metadata, 
  onView,
  onShare
}) => {
  const [showIssuer, setShowIssuer] = useState(false);
  
  // Extract information from metadata
  const credentialType = metadata.credentialType as CredentialType;
  const typeName = credentialTypeNames[credentialType] || 'Unknown';
  const typeColor = typeColors[credentialType] || 'bg-gray-600';
  const status = metadata.status as ClaimStatus;
  const statusInfo = statusConfig[status];
  
  // Format dates
  const issuedDate = metadata.issuanceDate 
    ? formatDistanceToNow(new Date(metadata.issuanceDate), { addSuffix: true })
    : 'Unknown';
    
  const expiryDate = metadata.expirationDate 
    ? formatDistanceToNow(new Date(metadata.expirationDate), { addSuffix: true })
    : 'Never';

  // Format issuer DID for display
  const issuerDid = metadata.issuer || '';
  const truncatedIssuer = issuerDid.length > 30 
    ? `${issuerDid.substring(0, 15)}...${issuerDid.substring(issuerDid.length - 10)}`
    : issuerDid;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className={`${typeColor} p-4 text-white flex justify-between items-center`}>
        <div className="flex items-center">
          <Shield className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">{typeName}</h3>
        </div>
        <div className={`flex items-center ${statusInfo.color}`}>
          {statusInfo.icon}
          <span className="ml-1 text-sm">
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="mb-4">
          <p className="text-xs text-gray-500">Credential ID</p>
          <p className="text-sm font-mono truncate">{credentialId}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-xs text-gray-500">Issuer</p>
          <div className="flex items-center">
            <p className="text-sm font-mono truncate">
              {showIssuer ? issuerDid : truncatedIssuer}
            </p>
            <button 
              onClick={() => setShowIssuer(!showIssuer)}
              className="ml-2 text-blue-500 hover:text-blue-700"
            >
              {showIssuer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Issued</p>
            <p className="text-sm">{issuedDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expires</p>
            <p className="text-sm">{expiryDate}</p>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="border-t border-gray-200 p-4 flex justify-between">
        <button 
          onClick={() => onView(credentialId)}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Eye className="w-4 h-4 mr-1" />
          <span>View</span>
        </button>
        
        <button 
          onClick={() => onShare(credentialId)}
          className="text-green-600 hover:text-green-800 flex items-center"
          disabled={status !== ClaimStatus.VERIFIED}
        >
          <Share2 className="w-4 h-4 mr-1" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default CredentialCard; 
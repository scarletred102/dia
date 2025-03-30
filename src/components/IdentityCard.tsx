import React from 'react';
import { Shield, User, Award, RefreshCw, Clock } from 'lucide-react';
import { Identity, ClaimStatus } from '../types/identity';

interface IdentityCardProps {
  identity: Identity;
  isLoading?: boolean;
  onSync?: () => void;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({ 
  identity, 
  isLoading,
  onSync 
}) => {
  const getClaimStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.VERIFIED:
        return 'text-green-600';
      case ClaimStatus.PENDING:
        return 'text-yellow-600';
      case ClaimStatus.EXPIRED:
      case ClaimStatus.REVOKED:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Digital Identity</h2>
            <p className="text-sm text-gray-500 break-all">{identity.did}</p>
          </div>
        </div>
        {onSync && (
          <button
            onClick={onSync}
            disabled={isLoading}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
              isLoading ? 'animate-spin' : ''
            }`}
            aria-label="Sync identity data"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium">Wallet Address</span>
          </div>
          <span className="text-sm text-gray-600 break-all">{identity.address}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Award className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">Reputation Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">{identity.reputation}</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${(identity.reputation / 1000) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {identity.claims.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Verified Claims</h3>
            <div className="space-y-2">
              {identity.claims.map((claim) => (
                <div key={claim.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{claim.type}</span>
                    <span className={`text-sm ${getClaimStatusColor(claim.status)}`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{claim.value}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Issued: {formatDate(claim.timestamp)}</span>
                    </div>
                    {claim.expiresAt && (
                      <span>Expires: {formatDate(claim.expiresAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {identity.lastUpdated && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Last updated: {formatDate(identity.lastUpdated)}
          </div>
        )}
      </div>
    </div>
  );
};
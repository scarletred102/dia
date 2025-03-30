import React from 'react';
import { RefreshCw, User, Star, Key } from 'lucide-react';
import { Identity } from '../types/identity';

interface IdentityCardProps {
  identity: Identity;
  isLoading: boolean;
  onSync: () => void;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({
  identity,
  isLoading,
  onSync,
}) => {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-blue-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-white" />
            <h3 className="text-lg font-semibold text-white">Identity Details</h3>
          </div>
          <button
            onClick={onSync}
            disabled={isLoading}
            className={`
              p-2 rounded-full hover:bg-blue-500 transition-colors
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title="Sync Identity"
          >
            <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* DID Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-600">
            <Key className="w-4 h-4" />
            <span className="text-sm font-medium">Decentralized Identifier (DID)</span>
          </div>
          <p className="text-sm font-mono bg-gray-50 p-2 rounded">{identity.did}</p>
        </div>

        {/* Ethereum Address */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-600">
            <Key className="w-4 h-4" />
            <span className="text-sm font-medium">Ethereum Address</span>
          </div>
          <p className="text-sm font-mono bg-gray-50 p-2 rounded">{identity.address}</p>
        </div>

        {/* Reputation Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-600">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">Reputation Score</span>
            </div>
            <span className="text-lg font-semibold text-blue-600">{identity.reputation}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(identity.reputation / 1000) * 100}%` }}
            />
          </div>
        </div>

        {/* Verified Claims */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Verified Claims</span>
          </div>
          <ul className="space-y-2">
            {identity.claims.map(claim => (
              <li 
                key={claim.id}
                className="bg-gray-50 p-3 rounded-lg space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{claim.type}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    {claim.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{claim.value}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Issued by: {claim.issuer}</span>
                  <span>
                    {new Date(claim.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(identity.lastUpdated).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { useCredentials } from '../hooks/useCredentials';
import { 
  DocumentType, 
  VerificationMethod, 
  VerificationLevel
} from '../types/credentials';
import { Calendar, User, Flag, FileText, X } from 'lucide-react';

interface KYCFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const KYCForm: React.FC<KYCFormProps> = ({ onSubmit, onCancel }) => {
  const { issueKYCCredential, isLoading, error } = useCredentials();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    residenceCountry: '',
    documentType: DocumentType.PASSPORT,
    documentNumber: '',
    documentIssuer: '',
    documentIssuanceDate: '',
    documentExpiryDate: '',
    proofOfAddressType: DocumentType.UTILITY_BILL,
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is modified
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'nationality', 
      'residenceCountry', 'documentNumber', 'documentIssuer',
      'documentIssuanceDate', 'documentExpiryDate'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        errors[field] = 'This field is required';
      }
    });
    
    // Date validations
    const now = new Date();
    const dobDate = new Date(formData.dateOfBirth);
    const issuanceDate = new Date(formData.documentIssuanceDate);
    const expiryDate = new Date(formData.documentExpiryDate);
    
    if (formData.dateOfBirth && dobDate > now) {
      errors.dateOfBirth = 'Date of birth cannot be in the future';
    }
    
    if (formData.documentIssuanceDate && issuanceDate > now) {
      errors.documentIssuanceDate = 'Issuance date cannot be in the future';
    }
    
    if (formData.documentExpiryDate && expiryDate < now) {
      errors.documentExpiryDate = 'Document has expired';
    }
    
    if (formData.documentIssuanceDate && formData.documentExpiryDate && issuanceDate >= expiryDate) {
      errors.documentExpiryDate = 'Expiry date must be after issuance date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Format data for credential issuance
      const kycData = {
        name: {
          firstName: formData.firstName,
          middleName: formData.middleName || undefined,
          lastName: formData.lastName,
        },
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        nationality: formData.nationality,
        residenceCountry: formData.residenceCountry,
        verificationLevel: VerificationLevel.STANDARD,
        verificationMethods: [
          VerificationMethod.DOCUMENT_SCAN,
          VerificationMethod.PROOF_OF_ADDRESS
        ],
        documentType: formData.documentType as DocumentType,
        documentNumber: formData.documentNumber,
        documentIssuer: formData.documentIssuer,
        documentIssuanceDate: new Date(formData.documentIssuanceDate).toISOString(),
        documentExpiryDate: new Date(formData.documentExpiryDate).toISOString(),
        proofOfAddressType: formData.proofOfAddressType as DocumentType,
        lastVerifiedDate: new Date().toISOString(),
      };
      
      // Create expiration date (1 year from now)
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      
      // Issue the credential
      const success = await issueKYCCredential(kycData, expirationDate);
      
      if (success) {
        onSubmit();
      } else {
        setSubmissionError('Failed to issue credential');
      }
    } catch (err) {
      setSubmissionError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {/* Personal Information */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.firstName && (
              <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.lastName && (
              <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Calendar className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`w-full p-2 pl-10 border rounded-md ${formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {formErrors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{formErrors.dateOfBirth}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nationality *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Flag className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="e.g., USA"
                className={`w-full p-2 pl-10 border rounded-md ${formErrors.nationality ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {formErrors.nationality && (
              <p className="text-red-500 text-xs mt-1">{formErrors.nationality}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country of Residence *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Flag className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="text"
                name="residenceCountry"
                value={formData.residenceCountry}
                onChange={handleChange}
                placeholder="e.g., USA"
                className={`w-full p-2 pl-10 border rounded-md ${formErrors.residenceCountry ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {formErrors.residenceCountry && (
              <p className="text-red-500 text-xs mt-1">{formErrors.residenceCountry}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Document Information */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Document Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type *
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value={DocumentType.PASSPORT}>Passport</option>
              <option value={DocumentType.DRIVING_LICENSE}>Driving License</option>
              <option value={DocumentType.NATIONAL_ID}>National ID</option>
              <option value={DocumentType.RESIDENCE_PERMIT}>Residence Permit</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Number *
            </label>
            <input
              type="text"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${formErrors.documentNumber ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.documentNumber && (
              <p className="text-red-500 text-xs mt-1">{formErrors.documentNumber}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issuing Authority *
            </label>
            <input
              type="text"
              name="documentIssuer"
              value={formData.documentIssuer}
              onChange={handleChange}
              placeholder="e.g., Department of State"
              className={`w-full p-2 border rounded-md ${formErrors.documentIssuer ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.documentIssuer && (
              <p className="text-red-500 text-xs mt-1">{formErrors.documentIssuer}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proof of Address
            </label>
            <select
              name="proofOfAddressType"
              value={formData.proofOfAddressType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value={DocumentType.UTILITY_BILL}>Utility Bill</option>
              <option value={DocumentType.BANK_STATEMENT}>Bank Statement</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Issue *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Calendar className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="date"
                name="documentIssuanceDate"
                value={formData.documentIssuanceDate}
                onChange={handleChange}
                className={`w-full p-2 pl-10 border rounded-md ${formErrors.documentIssuanceDate ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {formErrors.documentIssuanceDate && (
              <p className="text-red-500 text-xs mt-1">{formErrors.documentIssuanceDate}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Expiry *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Calendar className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="date"
                name="documentExpiryDate"
                value={formData.documentExpiryDate}
                onChange={handleChange}
                className={`w-full p-2 pl-10 border rounded-md ${formErrors.documentExpiryDate ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {formErrors.documentExpiryDate && (
              <p className="text-red-500 text-xs mt-1">{formErrors.documentExpiryDate}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Form errors */}
      {(error || submissionError) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || submissionError}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Form actions */}
      <div className="flex justify-end space-x-3 pt-5 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit KYC'}
        </button>
      </div>
    </form>
  );
};

export default KYCForm; 
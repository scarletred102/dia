interface EnvConfig {
  apiBaseUrl: string;
  ethereumRpcUrl: string;
  encryptionKey: string;
  environment: 'development' | 'production' | 'test';
}

function validateEnvConfig(config: Partial<EnvConfig>): EnvConfig {
  const requiredFields: (keyof EnvConfig)[] = ['apiBaseUrl', 'ethereumRpcUrl', 'encryptionKey'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required environment variable: ${field}`);
    }
  }

  return {
    apiBaseUrl: config.apiBaseUrl!,
    ethereumRpcUrl: config.ethereumRpcUrl!,
    encryptionKey: config.encryptionKey!,
    environment: (config.environment || 'development') as EnvConfig['environment'],
  };
}

// Load environment variables
const envConfig = validateEnvConfig({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  ethereumRpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL,
  encryptionKey: import.meta.env.VITE_ENCRYPTION_KEY,
  environment: import.meta.env.MODE as EnvConfig['environment'],
});

export default envConfig; 
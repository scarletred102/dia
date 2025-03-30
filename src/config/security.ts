interface SecurityConfig {
  rateLimit: {
    requests: number;
    window: number;
  };
  session: {
    timeout: number;
    refreshInterval: number;
  };
  encryption: {
    algorithm: string;
    keySize: number;
    ivSize: number;
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  headers: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    xXSSProtection: string;
    referrerPolicy: string;
    permissionsPolicy: string;
  };
}

const developmentConfig: SecurityConfig = {
  rateLimit: {
    requests: 100,
    window: 60000, // 1 minute
  },
  session: {
    timeout: 30 * 60 * 1000, // 30 minutes
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  },
  encryption: {
    algorithm: 'AES-GCM',
    keySize: 256,
    ivSize: 12,
  },
  cors: {
    allowedOrigins: ['http://localhost:5173', 'http://localhost:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  },
  headers: {
    contentSecurityPolicy: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://*.ethereum.org wss://*.ethereum.org;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim(),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
};

const productionConfig: SecurityConfig = {
  rateLimit: {
    requests: 50,
    window: 60000, // 1 minute
  },
  session: {
    timeout: 15 * 60 * 1000, // 15 minutes
    refreshInterval: 2 * 60 * 1000, // 2 minutes
  },
  encryption: {
    algorithm: 'AES-GCM',
    keySize: 256,
    ivSize: 12,
  },
  cors: {
    allowedOrigins: ['https://your-production-domain.com'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  },
  headers: {
    contentSecurityPolicy: `
      default-src 'self';
      script-src 'self';
      style-src 'self';
      img-src 'self' data: https:;
      connect-src 'self' https://*.ethereum.org wss://*.ethereum.org;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim(),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
};

export const securityConfig: SecurityConfig = 
  process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig; 
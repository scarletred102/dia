import { securityConfig } from '../config/security';
import { securityMonitor } from '../utils/security';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class SecureApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async generateCSRFToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to generate CSRF token');
    }

    const { token } = await response.json();
    this.csrfToken = token;
    return token;
  }

  private async getHeaders(): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    });

    if (this.csrfToken) {
      headers.set('X-CSRF-Token', this.csrfToken);
    }

    return headers;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestOptions,
    retries: number = 3
  ): Promise<Response> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: await this.getHeaders(),
        });

        clearTimeout(timeout);

        // Log security metrics
        const endTime = Date.now();
        securityMonitor.updateSecurityMetrics({
          requestCount: 1,
          responseTime: endTime - startTime,
          errorRate: response.ok ? 0 : 1,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        if (i === retries - 1) break;
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, (options.retryDelay || 1000) * Math.pow(2, i))
        );
      }
    }

    throw lastError;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}${endpoint}`,
        { ...options, method: 'GET' }
      );
      return response.json();
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'API_REQUEST_FAILED',
        severity: 'HIGH',
        details: { endpoint, method: 'GET', error: error.message }
      });
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    try {
      // Ensure CSRF token for POST requests
      if (!this.csrfToken) {
        await this.generateCSRFToken();
      }

      const response = await this.fetchWithRetry(
        `${this.baseUrl}${endpoint}`,
        {
          ...options,
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.json();
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'API_REQUEST_FAILED',
        severity: 'HIGH',
        details: { endpoint, method: 'POST', error: error.message }
      });
      throw error;
    }
  }

  async put<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    try {
      if (!this.csrfToken) {
        await this.generateCSRFToken();
      }

      const response = await this.fetchWithRetry(
        `${this.baseUrl}${endpoint}`,
        {
          ...options,
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.json();
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'API_REQUEST_FAILED',
        severity: 'HIGH',
        details: { endpoint, method: 'PUT', error: error.message }
      });
      throw error;
    }
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      if (!this.csrfToken) {
        await this.generateCSRFToken();
      }

      const response = await this.fetchWithRetry(
        `${this.baseUrl}${endpoint}`,
        { ...options, method: 'DELETE' }
      );
      return response.json();
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'API_REQUEST_FAILED',
        severity: 'HIGH',
        details: { endpoint, method: 'DELETE', error: error.message }
      });
      throw error;
    }
  }
}

// Export singleton instance
export const secureApiClient = new SecureApiClient(import.meta.env.VITE_API_BASE_URL || ''); 
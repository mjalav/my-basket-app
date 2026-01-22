import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Base API class with reusable HTTP methods
 * Provides common functionality for all API page objects
 */
export class BaseAPI {
  protected request: APIRequestContext;
  protected baseURL: string;
  protected defaultTimeout: number;

  constructor(request: APIRequestContext, baseURL?: string) {
    this.request = request;
    this.baseURL = baseURL || process.env.CART_SERVICE_URL || 'http://localhost:3002';
    this.defaultTimeout = parseInt(process.env.API_TIMEOUT || '10000');
  }

  /**
   * Perform GET request
   */
  async get(
    endpoint: string,
    options?: {
      params?: Record<string, string | number>;
      headers?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<APIResponse> {
    const url = `${this.baseURL}${endpoint}`;
    
    return await this.request.get(url, {
      params: options?.params,
      headers: options?.headers,
      timeout: options?.timeout || this.defaultTimeout,
    });
  }

  /**
   * Perform POST request
   */
  async post(
    endpoint: string,
    options?: {
      data?: any;
      headers?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<APIResponse> {
    const url = `${this.baseURL}${endpoint}`;
    
    return await this.request.post(url, {
      data: options?.data,
      headers: options?.headers,
      timeout: options?.timeout || this.defaultTimeout,
    });
  }

  /**
   * Perform PUT request
   */
  async put(
    endpoint: string,
    options?: {
      data?: any;
      headers?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<APIResponse> {
    const url = `${this.baseURL}${endpoint}`;
    
    return await this.request.put(url, {
      data: options?.data,
      headers: options?.headers,
      timeout: options?.timeout || this.defaultTimeout,
    });
  }

  /**
   * Perform DELETE request
   */
  async delete(
    endpoint: string,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<APIResponse> {
    const url = `${this.baseURL}${endpoint}`;
    
    return await this.request.delete(url, {
      headers: options?.headers,
      timeout: options?.timeout || this.defaultTimeout,
    });
  }

  /**
   * Perform PATCH request
   */
  async patch(
    endpoint: string,
    options?: {
      data?: any;
      headers?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<APIResponse> {
    const url = `${this.baseURL}${endpoint}`;
    
    return await this.request.patch(url, {
      data: options?.data,
      headers: options?.headers,
      timeout: options?.timeout || this.defaultTimeout,
    });
  }

  /**
   * Wait for specific duration
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get response body as JSON
   */
  async getResponseBody<T>(response: APIResponse): Promise<T> {
    return await response.json() as T;
  }

  /**
   * Check if response is successful (2xx)
   */
  isSuccessful(response: APIResponse): boolean {
    const status = response.status();
    return status >= 200 && status < 300;
  }

  /**
   * Check if response is client error (4xx)
   */
  isClientError(response: APIResponse): boolean {
    const status = response.status();
    return status >= 400 && status < 500;
  }

  /**
   * Check if response is server error (5xx)
   */
  isServerError(response: APIResponse): boolean {
    const status = response.status();
    return status >= 500 && status < 600;
  }

  /**
   * Log request details (for debugging)
   */
  protected logRequest(method: string, url: string, data?: any): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[${method}] ${url}`, data ? JSON.stringify(data) : '');
    }
  }

  /**
   * Log response details (for debugging)
   */
  protected async logResponse(response: APIResponse): Promise<void> {
    if (process.env.LOG_LEVEL === 'debug') {
      const body = await response.text();
      console.log(`[${response.status()}] ${response.url()}`, body);
    }
  }
}

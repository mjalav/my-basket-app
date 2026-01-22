import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './base-api';
import { HealthCheckResponse } from '../types/health-check.types';

/**
 * Page Object Model for Health Check API
 * Handles interactions with /api/health endpoint
 */
export class HealthCheckAPI extends BaseAPI {
  private readonly healthEndpoint = '/api/health';

  constructor(request: APIRequestContext, baseURL?: string) {
    super(request, baseURL);
  }

  /**
   * Perform health check
   * @returns APIResponse from health check endpoint
   */
  async checkHealth(timeout?: number): Promise<APIResponse> {
    this.logRequest('GET', this.healthEndpoint);
    
    const response = await this.get(this.healthEndpoint, {
      timeout: timeout || 10000,
    });
    
    await this.logResponse(response);
    return response;
  }

  /**
   * Get health check response body
   * @returns Parsed health check response
   */
  async getHealthStatus(timeout?: number): Promise<HealthCheckResponse> {
    const response = await this.checkHealth(timeout);
    return await this.getResponseBody<HealthCheckResponse>(response);
  }

  /**
   * Check if service is healthy
   * @returns true if status is 'healthy', false otherwise
   */
  async isHealthy(timeout?: number): Promise<boolean> {
    try {
      const response = await this.checkHealth(timeout);
      if (!this.isSuccessful(response)) {
        return false;
      }
      
      const body = await this.getResponseBody<HealthCheckResponse>(response);
      return body.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get dependency health status
   * @param dependencyName Name of the dependency to check
   * @returns Dependency health object or undefined if not found
   */
  async getDependencyHealth(dependencyName: string, timeout?: number) {
    const health = await this.getHealthStatus(timeout);
    return health.checks?.dependencies?.find(dep => dep.name === dependencyName);
  }

  /**
   * Get resource health status
   * @param resourceName Name of the resource to check
   * @returns Resource health object or undefined if not found
   */
  async getResourceHealth(resourceName: string, timeout?: number) {
    const health = await this.getHealthStatus(timeout);
    return health.checks?.resources?.find(res => res.name === resourceName);
  }

  /**
   * Wait for service to become healthy
   * @param maxWaitTime Maximum time to wait in milliseconds
   * @param checkInterval Interval between checks in milliseconds
   * @returns true if service became healthy, false if timeout
   */
  async waitForHealthy(
    maxWaitTime: number = 30000,
    checkInterval: number = 1000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isHealthy()) {
        return true;
      }
      await this.wait(checkInterval);
    }
    
    return false;
  }

  /**
   * Get health check response time
   * @returns Response time in milliseconds
   */
  async getResponseTime(): Promise<number> {
    const startTime = Date.now();
    await this.checkHealth();
    return Date.now() - startTime;
  }

  /**
   * Verify health check response structure
   * @returns true if response has all required fields
   */
  async verifyResponseStructure(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      
      // Required fields
      if (!health.status || !health.service || !health.timestamp) {
        return false;
      }
      
      // Status must be valid enum value
      if (!['healthy', 'unhealthy', 'degraded'].includes(health.status)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

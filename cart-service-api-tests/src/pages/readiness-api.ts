import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './base-api';
import { ReadinessResponse } from '../types/health-check.types';

/**
 * Page Object Model for Readiness API
 * Handles interactions with /api/health/ready endpoint
 */
export class ReadinessAPI extends BaseAPI {
  private readonly readinessEndpoint = '/api/health/ready';

  constructor(request: APIRequestContext, baseURL?: string) {
    super(request, baseURL);
  }

  /**
   * Perform readiness check
   * @returns APIResponse from readiness endpoint
   */
  async checkReadiness(timeout?: number): Promise<APIResponse> {
    this.logRequest('GET', this.readinessEndpoint);
    
    const response = await this.get(this.readinessEndpoint, {
      timeout: timeout || 10000,
    });
    
    await this.logResponse(response);
    return response;
  }

  /**
   * Get readiness response body
   * @returns Parsed readiness response
   */
  async getReadinessStatus(timeout?: number): Promise<ReadinessResponse> {
    const response = await this.checkReadiness(timeout);
    return await this.getResponseBody<ReadinessResponse>(response);
  }

  /**
   * Check if service is ready
   * @returns true if readiness check returns 200 and status is 'healthy', false otherwise
   */
  async isReady(timeout?: number): Promise<boolean> {
    try {
      const response = await this.checkReadiness(timeout);
      if (!this.isSuccessful(response)) {
        return false;
      }
      
      const body = await this.getResponseBody<ReadinessResponse>(response);
      return body.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for service to become ready
   * @param maxWaitTime Maximum time to wait in milliseconds
   * @param checkInterval Interval between checks in milliseconds
   * @returns true if service became ready, false if timeout
   */
  async waitForReady(
    maxWaitTime: number = 60000,
    checkInterval: number = 2000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isReady()) {
        return true;
      }
      await this.wait(checkInterval);
    }
    
    return false;
  }

  /**
   * Get readiness check response time
   * @returns Response time in milliseconds
   */
  async getResponseTime(): Promise<number> {
    const startTime = Date.now();
    await this.checkReadiness();
    return Date.now() - startTime;
  }

  /**
   * Verify readiness response structure
   * @returns true if response has all required fields
   */
  async verifyResponseStructure(): Promise<boolean> {
    try {
      const readiness = await this.getReadinessStatus();
      
      // Required fields
      if (!readiness.status || !readiness.service || !readiness.timestamp) {
        return false;
      }
      
      // Status must be valid enum value
      if (!['healthy', 'unhealthy', 'degraded'].includes(readiness.status)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify readiness check includes dependency validation
   * @returns true if readiness response includes dependency checks
   */
  async verifyDependencyChecks(): Promise<boolean> {
    try {
      const readiness = await this.getReadinessStatus();
      
      // Readiness should have checks object with dependencies
      return !!(
        readiness.checks &&
        readiness.checks.dependencies &&
        readiness.checks.dependencies.length > 0
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Get specific dependency status
   * @param dependencyName Name of the dependency
   * @returns Dependency health object or undefined
   */
  async getDependencyStatus(dependencyName: string, timeout?: number) {
    const readiness = await this.getReadinessStatus(timeout);
    return readiness.checks?.dependencies?.find(dep => dep.name === dependencyName);
  }

  /**
   * Verify readiness fails when dependency is down
   * @param dependencyName Name of the dependency that should be down
   * @returns true if readiness returns 503 and dependency is marked unhealthy
   */
  async verifyFailsWhenDependencyDown(dependencyName: string): Promise<boolean> {
    try {
      const response = await this.checkReadiness();
      
      // Should return 503
      if (response.status() !== 503) {
        return false;
      }
      
      const body = await this.getResponseBody<ReadinessResponse>(response);
      
      // Overall status should be unhealthy
      if (body.status !== 'unhealthy') {
        return false;
      }
      
      // Specific dependency should be unhealthy
      const dependency = body.checks?.dependencies?.find(dep => dep.name === dependencyName);
      return dependency?.status === 'unhealthy';
    } catch (error) {
      return false;
    }
  }
}

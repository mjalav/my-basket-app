import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './base-api';
import { LivenessResponse } from '../types/health-check.types';

/**
 * Page Object Model for Liveness API
 * Handles interactions with /api/health/live endpoint
 */
export class LivenessAPI extends BaseAPI {
  private readonly livenessEndpoint = '/api/health/live';

  constructor(request: APIRequestContext, baseURL?: string) {
    super(request, baseURL);
  }

  /**
   * Perform liveness check
   * @returns APIResponse from liveness endpoint
   */
  async checkLiveness(timeout?: number): Promise<APIResponse> {
    this.logRequest('GET', this.livenessEndpoint);
    
    const response = await this.get(this.livenessEndpoint, {
      timeout: timeout || 5000,
    });
    
    await this.logResponse(response);
    return response;
  }

  /**
   * Get liveness response body
   * @returns Parsed liveness response
   */
  async getLivenessStatus(timeout?: number): Promise<LivenessResponse> {
    const response = await this.checkLiveness(timeout);
    return await this.getResponseBody<LivenessResponse>(response);
  }

  /**
   * Check if service is alive
   * @returns true if liveness check returns 200, false otherwise
   */
  async isAlive(timeout?: number): Promise<boolean> {
    try {
      const response = await this.checkLiveness(timeout);
      return this.isSuccessful(response);
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for service to become alive
   * @param maxWaitTime Maximum time to wait in milliseconds
   * @param checkInterval Interval between checks in milliseconds
   * @returns true if service became alive, false if timeout
   */
  async waitForAlive(
    maxWaitTime: number = 30000,
    checkInterval: number = 1000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isAlive()) {
        return true;
      }
      await this.wait(checkInterval);
    }
    
    return false;
  }

  /**
   * Get liveness check response time
   * @returns Response time in milliseconds
   */
  async getResponseTime(): Promise<number> {
    const startTime = Date.now();
    await this.checkLiveness();
    return Date.now() - startTime;
  }

  /**
   * Verify liveness response structure
   * @returns true if response has all required fields
   */
  async verifyResponseStructure(): Promise<boolean> {
    try {
      const liveness = await this.getLivenessStatus();
      
      // Required fields
      if (!liveness.status || !liveness.service || !liveness.timestamp) {
        return false;
      }
      
      // Status must be valid enum value
      if (!['healthy', 'unhealthy', 'degraded'].includes(liveness.status)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify liveness check is simpler than full health check
   * Liveness should NOT include dependency checks
   * @returns true if liveness response doesn't have dependency checks
   */
  async verifySimpleLivenessCheck(): Promise<boolean> {
    try {
      const liveness = await this.getLivenessStatus();
      
      // Liveness should not have checks object (or it should be empty)
      const hasChecks = liveness.hasOwnProperty('checks');
      
      if (!hasChecks) {
        return true; // No checks object is good
      }
      
      // If checks exist, they should be empty or undefined
      const checks = (liveness as any).checks;
      return !checks || (
        (!checks.dependencies || checks.dependencies.length === 0) &&
        (!checks.resources || checks.resources.length === 0)
      );
    } catch (error) {
      return false;
    }
  }
}

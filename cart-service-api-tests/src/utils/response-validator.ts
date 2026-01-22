import { APIResponse } from '@playwright/test';
import { HealthCheckResponse, DependencyHealth, ResourceHealth } from '../types/health-check.types';

/**
 * Response Validator Utility
 * Provides validation functions for API responses
 */
export class ResponseValidator {
  /**
   * Validate HTTP status code
   */
  static validateStatusCode(response: APIResponse, expectedStatus: number): boolean {
    return response.status() === expectedStatus;
  }

  /**
   * Validate response has required headers
   */
  static validateHeaders(
    response: APIResponse,
    requiredHeaders: string[]
  ): boolean {
    const headers = response.headers();
    return requiredHeaders.every(header => 
      headers.hasOwnProperty(header.toLowerCase())
    );
  }

  /**
   * Validate health check response structure
   */
  static async validateHealthCheckResponse(
    response: APIResponse
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const body = await response.json() as HealthCheckResponse;
      
      // Required fields
      if (!body.status) errors.push('Missing required field: status');
      if (!body.service) errors.push('Missing required field: service');
      if (!body.timestamp) errors.push('Missing required field: timestamp');
      
      // Valid status enum
      if (body.status && !['healthy', 'unhealthy', 'degraded'].includes(body.status)) {
        errors.push(`Invalid status value: ${body.status}`);
      }
      
      // Timestamp format
      if (body.timestamp && isNaN(Date.parse(body.timestamp))) {
        errors.push('Invalid timestamp format');
      }
      
      // Optional fields validation
      if (body.uptime !== undefined && typeof body.uptime !== 'number') {
        errors.push('Uptime must be a number');
      }
      
      if (body.responseTime !== undefined && typeof body.responseTime !== 'number') {
        errors.push('Response time must be a number');
      }
      
      // Validate checks structure
      if (body.checks) {
        if (body.checks.dependencies) {
          body.checks.dependencies.forEach((dep, index) => {
            if (!dep.name) errors.push(`Dependency ${index}: missing name`);
            if (!dep.status) errors.push(`Dependency ${index}: missing status`);
          });
        }
        
        if (body.checks.resources) {
          body.checks.resources.forEach((res, index) => {
            if (!res.name) errors.push(`Resource ${index}: missing name`);
            if (!res.status) errors.push(`Resource ${index}: missing status`);
            if (res.value === undefined) errors.push(`Resource ${index}: missing value`);
            if (res.limit === undefined) errors.push(`Resource ${index}: missing limit`);
          });
        }
      }
      
      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Failed to parse response: ${error}`);
      return { valid: false, errors };
    }
  }

  /**
   * Validate dependency health structure
   */
  static validateDependencyHealth(dependency: DependencyHealth): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!dependency.name) errors.push('Missing dependency name');
    if (!dependency.status) errors.push('Missing dependency status');
    if (!['healthy', 'unhealthy', 'degraded'].includes(dependency.status)) {
      errors.push(`Invalid dependency status: ${dependency.status}`);
    }
    
    if (dependency.responseTime !== undefined && typeof dependency.responseTime !== 'number') {
      errors.push('Response time must be a number');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate resource health structure
   */
  static validateResourceHealth(resource: ResourceHealth): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!resource.name) errors.push('Missing resource name');
    if (!resource.status) errors.push('Missing resource status');
    if (resource.value === undefined) errors.push('Missing resource value');
    if (resource.limit === undefined) errors.push('Missing resource limit');
    if (!resource.unit) errors.push('Missing resource unit');
    
    if (!['healthy', 'unhealthy', 'degraded'].includes(resource.status)) {
      errors.push(`Invalid resource status: ${resource.status}`);
    }
    
    if (typeof resource.value !== 'number') errors.push('Value must be a number');
    if (typeof resource.limit !== 'number') errors.push('Limit must be a number');
    if (typeof resource.percentage !== 'number') errors.push('Percentage must be a number');
    
    // Validate percentage calculation
    const expectedPercentage = Math.round((resource.value / resource.limit) * 100);
    if (Math.abs(resource.percentage - expectedPercentage) > 1) {
      errors.push(`Percentage mismatch: expected ~${expectedPercentage}, got ${resource.percentage}`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate response time is within acceptable range
   */
  static validateResponseTime(
    actualTime: number,
    maxTime: number
  ): { valid: boolean; error?: string } {
    if (actualTime > maxTime) {
      return {
        valid: false,
        error: `Response time ${actualTime}ms exceeds maximum ${maxTime}ms`
      };
    }
    return { valid: true };
  }

  /**
   * Validate content type header
   */
  static validateContentType(
    response: APIResponse,
    expectedType: string = 'application/json'
  ): boolean {
    const contentType = response.headers()['content-type'];
    return contentType?.includes(expectedType) || false;
  }
}

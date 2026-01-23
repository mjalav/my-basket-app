import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { Logger } from '../utils/logger';

export abstract class BaseAPI {
  protected request: APIRequestContext;
  protected baseUrl: string;
  protected logger: Logger;

  constructor(request: APIRequestContext, baseUrl: string) {
    this.request = request;
    this.baseUrl = baseUrl;
    this.logger = new Logger(this.constructor.name);
  }

  public async get(endpoint: string, options: any = {}): Promise<APIResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger.info(`GET Request: ${url}`);
    const response = await this.request.get(url, options);
    await this.logResponse(response);
    return response;
  }

  public async post(endpoint: string, data: any, options: any = {}): Promise<APIResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger.info(`POST Request: ${url}`);
    if (data) this.logger.debug(`Payload: ${JSON.stringify(data, null, 2)}`);
    const response = await this.request.post(url, { ...options, data });
    await this.logResponse(response);
    return response;
  }

  public async put(endpoint: string, data: any, options: any = {}): Promise<APIResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger.info(`PUT Request: ${url}`);
    if (data) this.logger.debug(`Payload: ${JSON.stringify(data, null, 2)}`);
    const response = await this.request.put(url, { ...options, data });
    await this.logResponse(response);
    return response;
  }

  public async patch(endpoint: string, data: any, options: any = {}): Promise<APIResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger.info(`PATCH Request: ${url}`);
    if (data) this.logger.debug(`Payload: ${JSON.stringify(data, null, 2)}`);
    const response = await this.request.patch(url, { ...options, data });
    await this.logResponse(response);
    return response;
  }

  public async delete(endpoint: string, options: any = {}): Promise<APIResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger.info(`DELETE Request: ${url}`);
    const response = await this.request.delete(url, options);
    await this.logResponse(response);
    return response;
  }

  private async logResponse(response: APIResponse) {
    const status = response.status();
    const statusText = response.statusText();
    this.logger.info(`Response Status: ${status} ${statusText}`);
    
    try {
      const body = await response.json();
      this.logger.debug(`Response Body: ${JSON.stringify(body, null, 2)}`);
    } catch (e) {
      // Body might not be JSON or empty
      const text = await response.text();
      if (text) {
        this.logger.debug(`Response Body (Text): ${text}`);
      }
    }
  }

  /**
   * Common assertions
   */
  async assertStatus(response: APIResponse, expectedStatus: number) {
    expect(response.status(), `Expected status ${expectedStatus} but got ${response.status()}`).toBe(expectedStatus);
  }

  async assertSuccess(response: APIResponse) {
    expect(response.ok(), `Expected successful response but got status ${response.status()}`).toBeTruthy();
  }
}

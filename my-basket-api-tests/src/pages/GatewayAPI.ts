import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export class GatewayAPI extends BaseAPI {
  constructor(request: APIRequestContext, baseUrl: string) {
    super(request, baseUrl);
  }

  async getHealth(): Promise<APIResponse> {
    return this.get('/health');
  }

  async getInfo(): Promise<APIResponse> {
    return this.get('/info');
  }
}

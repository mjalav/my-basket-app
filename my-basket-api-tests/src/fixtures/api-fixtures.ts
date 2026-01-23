import { test as base } from '@playwright/test';
import { GatewayAPI } from '../pages/GatewayAPI';
import { ProductAPI } from '../pages/ProductAPI';
import { CartAPI } from '../pages/CartAPI';
import { OrderAPI } from '../pages/OrderAPI';
import { AIAPI } from '../pages/AIAPI';
import { config } from '../utils/config';

type MyFixtures = {
  gatewayApi: GatewayAPI;
  productApi: ProductAPI;
  cartApi: CartAPI;
  orderApi: OrderAPI;
  aiApi: AIAPI;
};

export const test = base.extend<MyFixtures>({
  gatewayApi: async ({ request }, use) => {
    await use(new GatewayAPI(request, config.baseUrl));
  },
  productApi: async ({ request }, use) => {
    await use(new ProductAPI(request, config.baseUrl));
  },
  cartApi: async ({ request }, use) => {
    await use(new CartAPI(request, config.baseUrl));
  },
  orderApi: async ({ request }, use) => {
    await use(new OrderAPI(request, config.baseUrl));
  },
  aiApi: async ({ request }, use) => {
    await use(new AIAPI(request, config.baseUrl));
  },
});

export { expect } from '@playwright/test';

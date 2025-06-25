# Product Service

Microservice for managing products in the retail application.

## API Endpoints

### Products
- `GET /api/products` - Get all products with optional filtering and pagination
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update product by ID
- `DELETE /api/products/:id` - Delete product by ID

### Categories
- `GET /api/categories` - Get all product categories

### Health Check
- `GET /api/health` - Health check endpoint

## Query Parameters for GET /api/products

- `category` - Filter by category
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `inStock` - Filter by stock availability (true/false)
- `search` - Search in name, description, or AI hint
- `page` - Page number for pagination (default: 1)
- `limit` - Items per page (default: 10, max: 100)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

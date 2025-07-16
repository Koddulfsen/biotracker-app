# Bio-Tracker Backend API

## Overview
Node.js/Express backend API for the Bio-Tracker nutrition tracking SaaS platform.

## Tech Stack
- Node.js 18+
- Express.js
- PostgreSQL
- Redis (caching)
- Auth0 (authentication)
- Stripe (payments)
- Docker

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and update values
3. Install dependencies: `npm install`
4. Start database: `docker-compose up -d postgres redis`
5. Run migrations: `npm run db:migrate`
6. Start dev server: `npm run dev`

### Using Docker
```bash
# Start all services
docker-compose up

# Start only backend services
docker-compose up postgres redis backend
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### User Management
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me/profile` - Update profile

### Nutrition Tracking
- `POST /api/v1/meals` - Create meal
- `GET /api/v1/meals` - Get meals
- `POST /api/v1/foods/search` - Search foods

### Practitioner Features
- `GET /api/v1/practitioner/patients` - Get patients
- `POST /api/v1/practitioner/patients` - Add patient
- `POST /api/v1/practitioner/meal-plans` - Create meal plan
- `POST /api/v1/practitioner/reports/generate` - Generate report

### Subscriptions
- `GET /api/v1/subscriptions` - Get current subscription
- `POST /api/v1/subscriptions/upgrade` - Upgrade subscription

## Development

### Project Structure
```
backend/
├── src/
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utilities
│   └── server.js       # Main server file
├── migrations/         # Database migrations
├── seeds/             # Database seeds
└── tests/             # Test files
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test auth.test.js
```

### Database Commands
```bash
# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:rollback

# Seed database
npm run db:seed
```

## Environment Variables
See `.env.example` for all required environment variables.

## API Documentation
API documentation is available at http://localhost:4000/api-docs when running in development mode.

## Security
- JWT authentication
- Rate limiting per tier
- Input validation
- SQL injection protection
- XSS protection
- CORS configured

## Deployment
See `DEPLOYMENT.md` for production deployment instructions.
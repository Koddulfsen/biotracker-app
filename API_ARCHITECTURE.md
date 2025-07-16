# Bio-Tracker API Architecture

## Overview
RESTful API with GraphQL for complex queries, built on Node.js/Express with PostgreSQL.

## API Structure

### Base URL Structure
```
Production: https://api.biotracker.health
Staging: https://api-staging.biotracker.health
Development: http://localhost:4000
```

### API Versioning
```
/api/v1/... (REST endpoints)
/graphql (GraphQL endpoint)
```

## Authentication Endpoints

### POST /api/v1/auth/register
Register new user account
```javascript
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "type": "personal|practitioner",
  "profile": {
    "age": 35,
    "sex": "male",
    "height": 180,
    "weight": 75
  },
  // For practitioners only
  "practitioner": {
    "licenseNumber": "RD123456",
    "state": "CA",
    "specialty": "Clinical Nutrition"
  }
}

// Response
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "type": "personal",
    "tier": "free"
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### POST /api/v1/auth/login
Authenticate user
```javascript
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "user": { /* user object */ },
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "subscription": { /* subscription details */ }
}
```

### POST /api/v1/auth/refresh
Refresh access token
```javascript
// Request
{
  "refreshToken": "refresh_token"
}

// Response
{
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

## User Management Endpoints

### GET /api/v1/users/me
Get current user profile
```javascript
// Headers
Authorization: Bearer {token}

// Response
{
  "id": "uuid",
  "email": "user@example.com",
  "type": "personal",
  "tier": "premium",
  "profile": {
    "age": 35,
    "sex": "male",
    "height": 180,
    "weight": 75,
    "activityLevel": "moderate",
    "dietaryRestrictions": ["gluten-free"],
    "healthConditions": [],
    "allergies": ["peanuts"]
  },
  "subscription": {
    "tier": "premium",
    "status": "active",
    "renewsAt": "2024-02-01T00:00:00Z"
  }
}
```

### PUT /api/v1/users/me/profile
Update user profile
```javascript
// Request
{
  "age": 36,
  "weight": 73,
  "activityLevel": "active",
  "dietaryRestrictions": ["gluten-free", "dairy-free"]
}

// Response
{
  "profile": { /* updated profile */ }
}
```

## Nutrition Tracking Endpoints

### POST /api/v1/meals
Create new meal entry
```javascript
// Request
{
  "name": "Breakfast",
  "mealType": "breakfast",
  "foods": [
    {
      "foodId": "uuid",
      "amount": 150,
      "unit": "g"
    },
    {
      "foodId": "uuid2",
      "amount": 250,
      "unit": "ml"
    }
  ],
  "loggedAt": "2024-01-15T08:30:00Z"
}

// Response
{
  "id": "uuid",
  "name": "Breakfast",
  "totalNutrients": {
    "calories": 425,
    "protein": 18.5,
    "carbs": 52.3,
    "fat": 15.2,
    // ... 100+ nutrients for premium users
  },
  "foods": [ /* food details */ ]
}
```

### GET /api/v1/meals
Get user's meals with pagination
```javascript
// Query params
?date=2024-01-15
?startDate=2024-01-01&endDate=2024-01-31
?page=1&limit=20

// Response
{
  "meals": [ /* array of meals */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  },
  "summary": {
    "totalCalories": 2150,
    "avgProtein": 85,
    "avgCarbs": 230,
    "avgFat": 70
  }
}
```

### POST /api/v1/foods/search
Search food database
```javascript
// Request
{
  "query": "chicken breast",
  "filters": {
    "brand": "Tyson",
    "category": "protein",
    "maxCalories": 200
  },
  "limit": 20
}

// Response
{
  "foods": [
    {
      "id": "uuid",
      "name": "Chicken Breast, Boneless, Skinless",
      "brand": "Tyson",
      "servingSize": 100,
      "servingUnit": "g",
      "nutrients": {
        "calories": 165,
        "protein": 31,
        // ... basic nutrients for free, all for premium
      }
    }
  ],
  "total": 45
}
```

## Practitioner Endpoints

### GET /api/v1/practitioner/patients
Get practitioner's patients
```javascript
// Response
{
  "patients": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "startedAt": "2024-01-01T00:00:00Z",
      "lastActivity": "2024-01-15T10:30:00Z",
      "compliance": 85.5,
      "activeMealPlan": {
        "id": "uuid",
        "name": "Weight Loss Plan"
      }
    }
  ],
  "stats": {
    "total": 8,
    "active": 7,
    "slotsUsed": 8,
    "slotsAvailable": 10
  }
}
```

### POST /api/v1/practitioner/patients
Add new patient
```javascript
// Request
{
  "email": "patient@example.com",
  "sendInvite": true,
  "message": "I'd like to help you with your nutrition goals"
}

// Response
{
  "patient": {
    "id": "uuid",
    "email": "patient@example.com",
    "status": "pending",
    "inviteSentAt": "2024-01-15T10:00:00Z"
  }
}
```

### POST /api/v1/practitioner/meal-plans
Create meal plan for patient
```javascript
// Request
{
  "patientId": "uuid",
  "name": "Heart Healthy Diet Plan",
  "description": "Low sodium, high fiber meal plan",
  "startDate": "2024-01-20",
  "endDate": "2024-02-20",
  "targetNutrients": {
    "calories": 2000,
    "protein": 80,
    "sodium": 1500,
    "fiber": 35
  },
  "dailyPlans": {
    "monday": {
      "breakfast": ["template_uuid_1"],
      "lunch": ["template_uuid_2"],
      "dinner": ["template_uuid_3"],
      "snacks": ["template_uuid_4"]
    }
    // ... other days
  }
}

// Response
{
  "mealPlan": {
    "id": "uuid",
    "status": "active",
    // ... full meal plan details
  }
}
```

### POST /api/v1/practitioner/reports/generate
Generate patient report
```javascript
// Request
{
  "patientId": "uuid",
  "reportType": "progress|compliance|nutrient_analysis",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-01-31",
  "includeCharts": true,
  "format": "pdf|html"
}

// Response
{
  "report": {
    "id": "uuid",
    "type": "progress",
    "generatedAt": "2024-01-15T15:00:00Z",
    "downloadUrl": "/api/v1/reports/uuid/download",
    "summary": {
      "complianceScore": 82.5,
      "weightChange": -2.3,
      "avgCalories": 1950,
      "nutrientGoalsMet": 18,
      "nutrientGoalsTotal": 20
    }
  }
}
```

## Organization Endpoints

### GET /api/v1/organization
Get organization details
```javascript
// Response
{
  "id": "uuid",
  "name": "City General Hospital",
  "type": "hospital",
  "practitioners": 15,
  "patients": 324,
  "subscription": {
    "tier": "enterprise",
    "practitionerSlots": 50,
    "practitionersActive": 15,
    "features": ["ehr_integration", "custom_protocols", "api_access"]
  }
}
```

### POST /api/v1/organization/practitioners/invite
Invite practitioner to organization
```javascript
// Request
{
  "email": "doctor@hospital.com",
  "role": "practitioner",
  "permissions": ["view_patients", "create_meal_plans"],
  "department": "Cardiology"
}

// Response
{
  "invitation": {
    "id": "uuid",
    "email": "doctor@hospital.com",
    "status": "pending",
    "expiresAt": "2024-01-22T00:00:00Z"
  }
}
```

### GET /api/v1/organization/analytics
Get organization-wide analytics
```javascript
// Query params
?period=month&date=2024-01

// Response
{
  "period": "2024-01",
  "metrics": {
    "totalPatients": 324,
    "activePlans": 287,
    "avgCompliance": 78.5,
    "practitionerActivity": {
      "mostActive": ["Dr. Smith", "Dr. Johnson"],
      "avgPatientsPerPractitioner": 21.6
    },
    "nutritionTrends": {
      "avgCalorieDeficit": -250,
      "mostCommonDeficiencies": ["Vitamin D", "Iron", "B12"],
      "dietaryPatterns": {
        "lowCarb": 45,
        "mediterranean": 89,
        "plantBased": 34
      }
    }
  }
}
```

## Billing & Subscription Endpoints

### GET /api/v1/subscription
Get current subscription
```javascript
// Response
{
  "id": "uuid",
  "tier": "professional",
  "status": "active",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "usage": {
    "patients": {
      "used": 8,
      "limit": 10,
      "additionalCost": 2
    }
  }
}
```

### POST /api/v1/subscription/upgrade
Upgrade subscription
```javascript
// Request
{
  "tier": "professional",
  "paymentMethodId": "pm_stripe_id",
  "additionalPatients": 5
}

// Response
{
  "subscription": {
    "id": "uuid",
    "tier": "professional",
    "status": "active",
    "upgradedAt": "2024-01-15T10:00:00Z"
  },
  "invoice": {
    "amount": 29.99,
    "proratedAmount": 15.50,
    "nextBilling": "2024-02-01T00:00:00Z"
  }
}
```

## GraphQL Schema

### Complex Queries Example
```graphql
# Get patient data with meal history and compliance
query GetPatientDetails($patientId: ID!, $dateRange: DateRange!) {
  patient(id: $patientId) {
    id
    profile {
      age
      weight
      height
      dietaryRestrictions
    }
    mealHistory(dateRange: $dateRange) {
      date
      meals {
        name
        foods {
          name
          amount
          nutrients {
            calories
            protein
          }
        }
      }
      compliance
      nutrientSummary {
        calories
        protein
        meetsDailyValues
      }
    }
    activeMealPlan {
      name
      targetNutrients
      compliance {
        overall
        byNutrient {
          nutrient
          percentage
        }
      }
    }
  }
}

# Organization dashboard query
query OrganizationDashboard($orgId: ID!, $period: Period!) {
  organization(id: $orgId) {
    id
    name
    analytics(period: $period) {
      practitioners {
        total
        active
        topPerformers {
          id
          name
          patientsManaged
          avgCompliance
        }
      }
      patients {
        total
        active
        byDepartment {
          department
          count
          avgCompliance
        }
      }
      nutritionInsights {
        commonDeficiencies
        dietaryTrends
        goalAchievement
      }
    }
  }
}
```

## Error Handling

### Standard Error Response
```javascript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "requestId": "req_uuid",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### Error Codes
- `AUTH_REQUIRED` - Authentication required
- `AUTH_INVALID` - Invalid credentials
- `PERMISSION_DENIED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SUBSCRIPTION_REQUIRED` - Feature requires subscription
- `PAYMENT_REQUIRED` - Payment failed
- `SERVER_ERROR` - Internal server error

## Rate Limiting

### Limits by Tier
```
Free Tier:
- 100 requests per 15 minutes

Premium Tier:
- 1000 requests per 15 minutes

Professional Tier:
- 5000 requests per 15 minutes
- Unlimited everything

Enterprise Tier:
- 50000 requests per 15 minutes
- Custom limits available
```

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642291200
```

## Webhooks

### Available Events
- `user.created`
- `user.upgraded`
- `subscription.updated`
- `subscription.canceled`
- `patient.added`
- `patient.removed`
- `meal_plan.created`
- `compliance.alert`

### Webhook Payload
```javascript
{
  "id": "evt_uuid",
  "type": "user.upgraded",
  "created": "2024-01-15T10:00:00Z",
  "data": {
    "userId": "uuid",
    "previousTier": "free",
    "newTier": "premium"
  }
}
```

## API Security

### Headers Required
```
Authorization: Bearer {jwt_token}
X-API-Version: 1.0
Content-Type: application/json
X-Request-ID: {uuid} // Optional but recommended
```

### CORS Configuration
```javascript
const corsOptions = {
  origin: [
    'https://app.biotracker.health',
    'https://biotracker.health',
    'http://localhost:3000' // Development only
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version']
};
```

## Performance Optimization

### Response Caching
- User profiles: 5 minutes
- Food search results: 1 hour
- Meal templates: 30 minutes
- Reports: 24 hours

### Pagination Defaults
- Default page size: 20
- Maximum page size: 100
- Cursor-based pagination for large datasets

### Field Selection
Support GraphQL-like field selection in REST:
```
GET /api/v1/meals?fields=id,name,totalNutrients.calories
```

This comprehensive API architecture provides a solid foundation for building a scalable, secure nutrition tracking platform serving multiple user types.
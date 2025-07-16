# BioTracker App

A full-stack micronutrient tracking application.

## Project Structure

```
BiotrackerApp/
├── backend/          # Node.js Express backend
├── src/              # React frontend source
├── public/           # React public assets
├── DATABASE_SCHEMA.sql
├── docker-compose.yml
└── setup.sh
```

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL
- Docker (optional)

### Setup

1. **Backend Setup**
```bash
cd backend
npm install
# Configure database connection in src/config/database.js
npm start
```

2. **Frontend Setup**
```bash
# In project root
npm install
npm start
```

3. **Database Setup**
```bash
# Create database and run schema
psql -U postgres < DATABASE_SCHEMA.sql
```

### Using Docker
```bash
docker-compose up
```

## Features
- User authentication with Auth0
- Nutrition tracking
- Meal planning
- Organization management for practitioners

## Documentation
- API_ARCHITECTURE.md - Backend API design
- USER_SYSTEM_ARCHITECTURE.md - User system design
- IMPLEMENTATION_ROADMAP.md - Development roadmap
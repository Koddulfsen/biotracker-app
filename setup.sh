#!/bin/bash

echo "🚀 Setting up Bio-Tracker Development Environment"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/logs
mkdir -p backend/migrations
mkdir -p backend/seeds

# Copy environment file
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update backend/.env with your actual configuration values"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Setting up database..."
docker-compose exec postgres psql -U biotracker -d biotracker -f /docker-entrypoint-initdb.d/01-schema.sql

echo "✅ Setup complete!"
echo ""
echo "To start the development servers:"
echo "  Backend: cd backend && npm run dev"
echo "  Frontend: npm start"
echo ""
echo "Or use Docker Compose for everything:"
echo "  docker-compose up"
echo ""
echo "📚 API Documentation: http://localhost:4000/api-docs"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:4000"
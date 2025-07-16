#!/bin/bash

echo "🚀 Starting BioTracker with XP System"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Option 1: Docker Compose (Recommended)
if command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Docker Compose detected. Starting with Docker...${NC}"
    
    # Stop any existing containers
    docker-compose down 2>/dev/null
    
    # Start all services
    echo "Starting services..."
    docker-compose up -d
    
    echo -e "${GREEN}✅ All services started with Docker!${NC}"
    echo ""
    echo "🔗 Access your app at:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:4000"
    echo "   - Database: localhost:5432"
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
    
# Option 2: Manual Start (No Docker)
else
    echo -e "${YELLOW}📦 Starting services manually...${NC}"
    
    # Check if ports are available
    echo "Checking ports..."
    check_port 3000 || exit 1
    check_port 4000 || exit 1
    check_port 5432 || { echo -e "${RED}PostgreSQL not running on port 5432. Please start PostgreSQL first.${NC}"; exit 1; }
    
    # Create .env files if they don't exist
    if [ ! -f backend/.env ]; then
        echo "Creating backend .env file..."
        cat > backend/.env << EOF
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://biotracker:biotracker123@localhost:5432/biotracker
JWT_SECRET=your-super-secret-jwt-key-change-this
REDIS_URL=redis://localhost:6379
EOF
    fi
    
    if [ ! -f .env ]; then
        echo "Creating frontend .env file..."
        cat > .env << EOF
REACT_APP_API_URL=http://localhost:4000/api/v1
EOF
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        echo "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    # Start backend in background
    echo -e "${GREEN}Starting backend server...${NC}"
    cd backend
    npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    sleep 5
    
    # Check if backend started successfully
    if ! curl -s http://localhost:4000/health > /dev/null; then
        echo -e "${RED}❌ Backend failed to start. Check backend.log for details.${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    # Start frontend
    echo -e "${GREEN}Starting frontend...${NC}"
    npm start &
    FRONTEND_PID=$!
    
    echo -e "${GREEN}✅ All services started!${NC}"
    echo ""
    echo "🔗 Access your app at:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:4000"
    echo ""
    echo "📝 Logs:"
    echo "   - Backend: tail -f backend.log"
    echo ""
    echo "🛑 Press Ctrl+C to stop all services"
    
    # Function to cleanup on exit
    cleanup() {
        echo ""
        echo "Stopping services..."
        kill $BACKEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
        echo "Services stopped."
        exit 0
    }
    
    # Set trap to cleanup on Ctrl+C
    trap cleanup INT
    
    # Wait for processes
    wait
fi

echo ""
echo "🎮 XP System Features:"
echo "   - Earn 10 XP for each meal logged"
echo "   - Level up every 100 XP"
echo "   - View your profile and stats"
echo "   - Customize your avatar and bio"
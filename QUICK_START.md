# 🚀 BioTracker XP System - Quick Start Guide

## Prerequisites
- Node.js 16+ installed
- PostgreSQL OR Docker installed

## Option 1: Start with Docker (Easiest)

```bash
# Run the automated startup script
./start-xp-system.sh

# Or manually with Docker Compose
docker-compose up
```

## Option 2: Start without Docker

### 1. Set up PostgreSQL Database

First, create the database and user:
```sql
CREATE USER biotracker WITH PASSWORD 'biotracker123';
CREATE DATABASE biotracker OWNER biotracker;
```

### 2. Run Database Migrations

```bash
# Run the base schema
psql -U biotracker -d biotracker < backend/DATABASE_SCHEMA.sql

# Run the XP system migration
psql -U biotracker -d biotracker < backend/scripts/add-profile-fields.sql
```

### 3. Test Database Connection

```bash
cd backend
node test-db-connection.js
```

### 4. Start the Application

```bash
# Use the automated script
./start-xp-system.sh

# Or manually in two terminals:
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm start
```

## 🎮 Using the XP System

1. **Create an Account**
   - Go to http://localhost:3000
   - Register a new account

2. **See Your XP Bar**
   - The experience bar appears at the top of the dashboard
   - Shows your current level and progress

3. **Earn XP**
   - Click "Track Meal" button
   - Log any meal to earn 10 XP instantly
   - Watch the XP bar animate!

4. **Level Up**
   - Every 100 XP = 1 Level
   - See the celebration animation when you level up

5. **Customize Your Profile**
   - Click "Profile" in the navigation
   - Add an avatar URL (any image URL)
   - Write a bio (140 characters max)
   - View your stats

## 🛠️ Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `backend/.env`
- Test connection: `cd backend && node test-db-connection.js`

### Port Already in Use
- Frontend (3000): `lsof -ti:3000 | xargs kill`
- Backend (4000): `lsof -ti:4000 | xargs kill`
- Database (5432): Check PostgreSQL service

### Missing Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
npm install
```

## 📊 Features Overview

✅ **Experience System**
- 10 XP per meal logged
- Level = XP / 100
- Animated progress bar
- Level-up celebrations

✅ **User Profiles**  
- Custom avatar (URL)
- Bio (140 chars)
- Member since date
- Statistics dashboard

✅ **Stats Tracking**
- Total XP earned
- Current level
- Meals logged count
- Days tracked

## 🎯 Next Steps

Once running, try these actions:
1. Log 10 meals to reach Level 2
2. Customize your profile
3. Check your stats page
4. Watch the XP animations

Enjoy your gamified nutrition tracking! 🎮🥗
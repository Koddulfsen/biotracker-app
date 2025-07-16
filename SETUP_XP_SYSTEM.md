# Setting Up the Experience & Profile System

## 1. Database Migration

Run the following migration to add profile and XP fields to your database:

```bash
# Navigate to backend directory
cd backend

# Run the migration script
psql -U [your_db_user] -d [your_db_name] < scripts/add-profile-fields.sql
```

Or manually run these SQL commands:

```sql
-- Add profile fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add bio length constraint
ALTER TABLE users
ADD CONSTRAINT bio_length_check CHECK (LENGTH(bio) <= 140);

-- Create XP transactions table
CREATE TABLE IF NOT EXISTS xp_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
```

## 2. Environment Variables

Make sure your backend `.env` file has:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/biotracker
PORT=4000
JWT_SECRET=your_jwt_secret
```

## 3. Start the Application

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd .. # Back to project root
npm install
npm start
```

## 4. Test the Features

1. **Create an account** or login
2. **Navigate to Dashboard** - You'll see the experience bar at the top
3. **Log a meal** via the "Track Meal" button - You'll gain 10 XP!
4. **Visit your profile** from the navigation menu
5. **Edit your profile** - Add an avatar URL and bio

## Features Included

✅ Experience Bar with animations
✅ +10 XP per meal logged
✅ Level system (100 XP per level)
✅ User profiles with avatar and bio
✅ Profile statistics dashboard
✅ Level display in navigation
✅ Mobile responsive design

## Future Enhancements

- Achievement badges
- Daily login streaks
- XP multipliers
- Leaderboards
- Social features
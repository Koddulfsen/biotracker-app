-- Migration script to add user profile and experience fields
-- Run this script to update the users table with profile functionality

-- Add profile fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add constraint for bio length (140 characters)
ALTER TABLE users
ADD CONSTRAINT bio_length_check CHECK (LENGTH(bio) <= 140);

-- Create index on total_xp for leaderboard queries (future feature)
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp DESC);

-- Update existing users with default values
UPDATE users
SET total_xp = 0
WHERE total_xp IS NULL;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('avatar_url', 'bio', 'total_xp', 'created_at');
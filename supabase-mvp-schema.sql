-- Simple MVP Schema for BiotrackerApp
-- This creates just the essential tables for basic meal tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Simple foods table (just the basics)
CREATE TABLE IF NOT EXISTS foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  protein DECIMAL(5,2) DEFAULT 0,
  carbs DECIMAL(5,2) DEFAULT 0,
  fat DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Meals table (linked to auth.users)
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Meal items (foods in a meal)
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  quantity DECIMAL(5,2) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert some basic foods to get started
INSERT INTO foods (name, calories, protein, carbs, fat) VALUES
  ('Apple', 95, 0.5, 25, 0.3),
  ('Banana', 105, 1.3, 27, 0.4),
  ('Chicken Breast (100g)', 165, 31, 0, 3.6),
  ('Brown Rice (1 cup)', 216, 5, 45, 1.8),
  ('Broccoli (1 cup)', 31, 2.5, 6, 0.3),
  ('Eggs (1 large)', 72, 6.3, 0.4, 4.8),
  ('Salmon (100g)', 208, 20, 0, 13),
  ('Greek Yogurt (1 cup)', 150, 20, 9, 4),
  ('Almonds (1 oz)', 164, 6, 6, 14),
  ('Whole Wheat Bread (1 slice)', 81, 4, 14, 1.1);

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see/edit their own meals
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for meal_items (through meal ownership)
CREATE POLICY "Users can view own meal items" ON meal_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meals 
      WHERE meals.id = meal_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meal items" ON meal_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meals 
      WHERE meals.id = meal_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meal items" ON meal_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM meals 
      WHERE meals.id = meal_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meal items" ON meal_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM meals 
      WHERE meals.id = meal_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

-- Everyone can read foods
CREATE POLICY "Public foods access" ON foods
  FOR SELECT USING (true);
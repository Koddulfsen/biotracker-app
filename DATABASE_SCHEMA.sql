-- Bio-Tracker Multi-Tenant Database Schema
-- PostgreSQL 14+ with Row Level Security (RLS)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_type AS ENUM ('personal', 'practitioner', 'staff', 'admin');
CREATE TYPE user_tier AS ENUM ('freemium', 'premium', 'professional', 'enterprise');
CREATE TYPE org_type AS ENUM ('hospital', 'clinic', 'wellness_center', 'private_practice');
CREATE TYPE payment_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- Users table (all user types)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_type user_type NOT NULL DEFAULT 'personal',
    user_tier user_tier NOT NULL DEFAULT 'freemium',
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User profiles (personal health data)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age >= 0 AND age <= 150),
    sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
    height_cm DECIMAL(5,2) CHECK (height_cm > 0 AND height_cm < 300),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'extreme')),
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    health_conditions JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    goals JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Organizations (hospitals, clinics, etc.)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    org_type org_type NOT NULL,
    tax_id VARCHAR(50),
    address JSONB,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_tier user_tier DEFAULT 'enterprise',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization members and roles
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'practitioner', 'staff', 'viewer')),
    permissions JSONB DEFAULT '[]'::jsonb,
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(organization_id, user_id)
);

-- =====================================================
-- PRACTITIONER SPECIFIC TABLES
-- =====================================================

-- Practitioner profiles
CREATE TABLE practitioner_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100),
    license_state VARCHAR(2),
    specialty VARCHAR(100),
    credentials VARCHAR(255),
    years_experience INTEGER,
    bio TEXT,
    consultation_rate DECIMAL(10,2),
    accepts_insurance BOOLEAN DEFAULT FALSE,
    insurance_providers JSONB DEFAULT '[]'::jsonb,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Practitioner-Patient relationships
CREATE TABLE practitioner_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'discharged')),
    relationship_type VARCHAR(50) DEFAULT 'direct',
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(practitioner_id, patient_id)
);

-- =====================================================
-- NUTRITION & FOOD TABLES
-- =====================================================

-- Foods database
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100),
    serving_size DECIMAL(10,2),
    serving_unit VARCHAR(50),
    nutrients JSONB NOT NULL DEFAULT '{}'::jsonb,
    ingredients TEXT[],
    allergens TEXT[],
    image_url VARCHAR(500),
    source VARCHAR(50), -- 'usda', 'openfoodfacts', 'custom'
    source_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    is_verified BOOLEAN DEFAULT FALSE
);

-- Create index for food lookups
CREATE INDEX idx_foods_name_gin ON foods USING gin(to_tsvector('english', name));

-- User custom foods
CREATE TABLE user_foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id),
    custom_name VARCHAR(255),
    custom_nutrients JSONB,
    custom_serving_size DECIMAL(10,2),
    custom_serving_unit VARCHAR(50),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, food_id)
);

-- Meals
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(50),
    foods JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {food_id, amount, unit}
    total_nutrients JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    photo_url VARCHAR(500),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meal templates (for practitioners)
CREATE TABLE meal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    target_calories INTEGER,
    foods JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_nutrients JSONB DEFAULT '{}'::jsonb,
    dietary_tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PATIENT MANAGEMENT TABLES
-- =====================================================

-- Meal plans (prescribed by practitioners)
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    practitioner_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    daily_plans JSONB NOT NULL DEFAULT '{}'::jsonb, -- {monday: [...meals], tuesday: [...]}
    target_nutrients JSONB DEFAULT '{}'::jsonb,
    restrictions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient progress tracking
CREATE TABLE patient_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES users(id),
    meal_plan_id UUID REFERENCES meal_plans(id),
    date DATE NOT NULL,
    compliance_score DECIMAL(5,2) CHECK (compliance_score >= 0 AND compliance_score <= 100),
    actual_nutrients JSONB DEFAULT '{}'::jsonb,
    target_nutrients JSONB DEFAULT '{}'::jsonb,
    weight_kg DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, date)
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    practitioner_id UUID NOT NULL REFERENCES users(id),
    report_type VARCHAR(50) NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary TEXT,
    recommendations TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    viewed_at TIMESTAMP WITH TIME ZONE,
    shared_with JSONB DEFAULT '[]'::jsonb
);

-- =====================================================
-- BILLING & SUBSCRIPTION TABLES
-- =====================================================

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    tier user_tier NOT NULL,
    status payment_status NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK ((user_id IS NOT NULL AND organization_id IS NULL) OR (user_id IS NULL AND organization_id IS NOT NULL))
);

-- Usage tracking for billing
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    feature VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for usage queries
CREATE INDEX idx_usage_tracking_user_feature_date ON usage_tracking(user_id, feature, tracked_at);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    stripe_invoice_id VARCHAR(255) UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_pdf VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ANALYTICS & TRACKING TABLES
-- =====================================================


-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Audit logs for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit queries
CREATE INDEX idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_self_access ON users
    FOR ALL USING (auth0_id = current_setting('app.current_user_auth0_id')::text);

-- Users can only access their own profile
CREATE POLICY user_profiles_self_access ON user_profiles
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE auth0_id = current_setting('app.current_user_auth0_id')::text
    ));

-- Users can only see their own meals
CREATE POLICY meals_self_access ON meals
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE auth0_id = current_setting('app.current_user_auth0_id')::text
    ));

-- Practitioners can see their patients' data
CREATE POLICY practitioner_patient_access ON meals
    FOR SELECT USING (
        user_id IN (
            SELECT patient_id FROM practitioner_patients
            WHERE practitioner_id IN (
                SELECT id FROM users WHERE auth0_id = current_setting('app.current_user_auth0_id')::text
            ) AND status = 'active'
        )
    );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate meal nutrients
CREATE OR REPLACE FUNCTION calculate_meal_nutrients(foods_array JSONB)
RETURNS JSONB AS $$
DECLARE
    total_nutrients JSONB := '{}'::jsonb;
    food_item JSONB;
    food_nutrients JSONB;
    amount NUMERIC;
    nutrient_key TEXT;
    nutrient_value NUMERIC;
BEGIN
    FOR food_item IN SELECT * FROM jsonb_array_elements(foods_array)
    LOOP
        -- Get food nutrients
        SELECT nutrients INTO food_nutrients
        FROM foods
        WHERE id = (food_item->>'food_id')::uuid;
        
        amount := (food_item->>'amount')::numeric;
        
        -- Sum up nutrients
        FOR nutrient_key, nutrient_value IN SELECT * FROM jsonb_each_text(food_nutrients)
        LOOP
            IF total_nutrients ? nutrient_key THEN
                total_nutrients := jsonb_set(
                    total_nutrients,
                    ARRAY[nutrient_key],
                    to_jsonb((total_nutrients->>nutrient_key)::numeric + (nutrient_value * amount / 100))
                );
            ELSE
                total_nutrients := jsonb_set(
                    total_nutrients,
                    ARRAY[nutrient_key],
                    to_jsonb(nutrient_value * amount / 100)
                );
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN total_nutrients;
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(user_id_param UUID, feature VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier user_tier;
    daily_count INTEGER;
    limit_reached BOOLEAN := FALSE;
BEGIN
    -- Get user tier
    SELECT u.user_tier INTO user_tier
    FROM users u
    WHERE u.id = user_id_param;
    
    -- Check daily usage
    SELECT COUNT(*) INTO daily_count
    FROM usage_tracking
    WHERE user_id = user_id_param
        AND feature = feature
        AND tracked_at >= CURRENT_DATE;
    
    -- Check limits based on tier and feature
    CASE
        WHEN feature = 'meal_export' AND user_tier = 'freemium' THEN
            limit_reached := TRUE; -- Not available on free tier
        ELSE
            limit_reached := FALSE;
    END CASE;
    
    RETURN NOT limit_reached;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id) WHERE organization_id IS NOT NULL;

-- Meal queries
CREATE INDEX idx_meals_user_date ON meals(user_id, logged_at DESC);
CREATE INDEX idx_meal_templates_public ON meal_templates(is_public) WHERE is_public = TRUE;

-- Patient management
CREATE INDEX idx_practitioner_patients_practitioner ON practitioner_patients(practitioner_id, status);
CREATE INDEX idx_practitioner_patients_patient ON practitioner_patients(patient_id, status);
CREATE INDEX idx_patient_progress_patient_date ON patient_progress(patient_id, date DESC);

-- Subscription queries
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default organization for demo
INSERT INTO organizations (id, name, org_type, subscription_tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Hospital', 'hospital', 'enterprise');

-- Insert sample nutrients structure
INSERT INTO foods (id, name, nutrients, source)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Sample Food', 
     '{"calories": 100, "protein": 10, "carbs": 15, "fat": 3, "fiber": 2}'::jsonb, 
     'system');
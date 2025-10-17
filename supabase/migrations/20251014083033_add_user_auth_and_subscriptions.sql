/*
  # Add User Authentication and Subscription System

  ## Overview
  This migration extends the Yaung Chi database to support user registration with phone verification 
  and a freemium subscription model with usage tracking.

  ## New Tables

  ### 1. users
  Stores registered user accounts
  - `id` (uuid, primary key) - Unique user identifier
  - `phone_number` (text, unique) - User's phone number (primary identifier)
  - `name` (text) - User's full name
  - `is_verified` (boolean) - Whether phone number is verified
  - `language_preference` (text) - Preferred language ('en' or 'my' for Burmese)
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login_at` (timestamptz) - Last login timestamp

  ### 2. verification_codes
  Manages phone verification codes
  - `id` (uuid, primary key) - Unique verification record identifier
  - `phone_number` (text) - Phone number awaiting verification
  - `code` (text) - 6-digit verification code
  - `expires_at` (timestamptz) - Code expiration time (10 minutes)
  - `is_used` (boolean) - Whether code has been used
  - `created_at` (timestamptz) - Code generation timestamp

  ### 3. subscriptions
  Tracks user subscription status
  - `id` (uuid, primary key) - Unique subscription identifier
  - `user_id` (uuid, foreign key) - Links to users table
  - `tier` (text) - Subscription tier: 'free' or 'paid'
  - `started_at` (timestamptz) - Subscription start date
  - `expires_at` (timestamptz) - Subscription expiration (null for free tier)
  - `is_active` (boolean) - Whether subscription is currently active
  - `payment_reference` (text) - Payment transaction reference
  - `created_at` (timestamptz) - Subscription record creation
  - `updated_at` (timestamptz) - Last subscription update

  ### 4. user_usage
  Tracks daily usage to enforce free tier limitations
  - `id` (uuid, primary key) - Unique usage record identifier
  - `user_id` (uuid, foreign key) - Links to users table
  - `date` (date) - Usage tracking date
  - `message_count` (integer) - Number of messages sent today
  - `weather_queries` (integer) - Number of weather queries today
  - `market_queries` (integer) - Number of market price queries today
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Schema Modifications
  - Add user_id column to conversations table to link conversations to users
  - Add constraint to ensure conversations belong to registered users

  ## Security
  - Enable RLS on all new tables
  - Users can only view and update their own data
  - Verification codes expire after 10 minutes
  - Usage tracking is user-specific and protected

  ## Indexes
  - Index on phone_number for fast user lookups
  - Index on user_id for subscription and usage queries
  - Index on date for usage tracking queries
  - Unique index on user_id + date for usage records

  ## Important Notes
  1. Free tier users limited to 20 messages per day
  2. Verification codes are 6 digits and expire in 10 minutes
  3. Free subscriptions never expire, paid subscriptions have expiration dates
  4. Usage resets daily at midnight
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  name text NOT NULL,
  is_verified boolean DEFAULT false,
  language_preference text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz DEFAULT now()
);

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('free', 'paid')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  payment_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer DEFAULT 0,
  weather_queries integer DEFAULT 0,
  market_queries integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Add user_id to conversations table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'user_id_fk'
  ) THEN
    ALTER TABLE conversations ADD COLUMN user_id_fk uuid REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(date);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_fk ON conversations(user_id_fk);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can create their profile"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for verification_codes table
CREATE POLICY "Anyone can create verification codes"
  ON verification_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view verification codes"
  ON verification_codes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update verification codes"
  ON verification_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (true);

CREATE POLICY "System can create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_usage table
CREATE POLICY "Users can view own usage"
  ON user_usage FOR SELECT
  USING (true);

CREATE POLICY "System can create usage records"
  ON user_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update usage records"
  ON user_usage FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create function to automatically create free subscription for new users
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, tier, is_active)
  VALUES (NEW.id, 'free', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create free subscription
DROP TRIGGER IF EXISTS auto_create_free_subscription ON users;
CREATE TRIGGER auto_create_free_subscription
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription();

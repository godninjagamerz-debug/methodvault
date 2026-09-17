-- MethodVault Database Schema
-- Run this against your PostgreSQL / Supabase database

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Methods table
CREATE TABLE IF NOT EXISTS methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  thumbnail_url TEXT,
  content TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT false,
  marketplace_listed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Method codes table
CREATE TABLE IF NOT EXISTS method_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(24) NOT NULL UNIQUE,
  method_id UUID NOT NULL REFERENCES methods(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'redeemed', 'revoked')),
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_method_codes_code ON method_codes(code);
CREATE INDEX IF NOT EXISTS idx_method_codes_method_id ON method_codes(method_id);
CREATE INDEX IF NOT EXISTS idx_method_codes_status ON method_codes(status);

-- User methods (ownership)
CREATE TABLE IF NOT EXISTS user_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_id UUID NOT NULL REFERENCES methods(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('code', 'purchase')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, method_id)
);

CREATE INDEX IF NOT EXISTS idx_user_methods_user_id ON user_methods(user_id);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  method_id UUID NOT NULL REFERENCES methods(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_razorpay_order_id ON purchases(razorpay_order_id);

-- Auto-update updated_at for methods
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER methods_updated_at
  BEFORE UPDATE ON methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

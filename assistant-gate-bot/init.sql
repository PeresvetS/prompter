-- Initialize the assistant_gate_bot database
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (handled by POSTGRES_DB env var)
-- Additional initialization can be added here if needed

-- Set timezone to UTC for consistent timestamp handling
SET timezone = 'UTC';

-- Create extension for UUID generation if needed in the future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 
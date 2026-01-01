-- Migration: Add unique constraint for is_kel_position
-- Purpose: Enforce database-level rule that only ONE Kel position can exist
-- Story: 6.4 Market Gap Identification - AC4 Single Kel Position Enforcement

-- Create unique partial index to enforce only one row can have is_kel_position = true
-- This prevents race conditions at the database level
CREATE UNIQUE INDEX IF NOT EXISTS competitor_data_unique_kel_position
  ON competitor_data (is_kel_position)
  WHERE is_kel_position = true;

-- Comment for documentation
COMMENT ON INDEX competitor_data_unique_kel_position IS
  'Ensures only one competitor can be marked as Kel''s target position (AC4)';

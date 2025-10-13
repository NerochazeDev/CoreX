
-- Add withdrawal_address column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS withdrawal_address text;

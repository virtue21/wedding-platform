-- Migration 004: Add venue_state to weddings, currency to registry_items

-- Add state field for Nigerian address selection
ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS venue_state text;

-- Add currency field to registry items (e.g. NGN, USD, GBP)
ALTER TABLE registry_items
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'NGN';

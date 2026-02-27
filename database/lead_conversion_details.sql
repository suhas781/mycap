-- Conversion details: required when lead status is set to Converted.
-- Run: psql -d mycap -f database/lead_conversion_details.sql

CREATE TABLE IF NOT EXISTS lead_conversion_details (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  course_name TEXT,
  course_fee NUMERIC,
  amount_paid NUMERIC,
  due_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_conversion_details_lead_id ON lead_conversion_details(lead_id);

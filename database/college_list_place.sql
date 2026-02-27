-- Add place to college_list. Run: psql -d mycap -f database/college_list_place.sql
ALTER TABLE college_list ADD COLUMN IF NOT EXISTS place VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_college_list_place ON college_list(place);

-- Courses: Team Lead adds courses; BOE selects from them when converting a lead.
-- Run: psql -d mycap -f database/courses.sql

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  team_lead_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_team_lead_id ON courses(team_lead_id);

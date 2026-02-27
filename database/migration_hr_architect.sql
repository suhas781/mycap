-- Run this if your users table was created with only team_lead and boe roles.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('team_lead', 'boe', 'hr', 'admin'));

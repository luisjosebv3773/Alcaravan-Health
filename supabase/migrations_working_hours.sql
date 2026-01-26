
-- Add working hours for professionals
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT '{
  "monday": {"enabled": true, "start": "08:00", "end": "17:00"},
  "tuesday": {"enabled": true, "start": "08:00", "end": "17:00"},
  "wednesday": {"enabled": true, "start": "08:00", "end": "17:00"},
  "thursday": {"enabled": true, "start": "08:00", "end": "17:00"},
  "friday": {"enabled": true, "start": "08:00", "end": "17:00"},
  "saturday": {"enabled": false, "start": "09:00", "end": "13:00"},
  "sunday": {"enabled": false, "start": "09:00", "end": "13:00"}
}'::jsonb;

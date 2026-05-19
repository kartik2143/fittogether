-- Add section column to workout_exercises
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'main'
  CHECK (section IN ('warmup', 'main', 'cooldown'));

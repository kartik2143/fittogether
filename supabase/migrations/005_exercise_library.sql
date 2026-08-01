-- Exercise library: a curated, editable catalogue of exercises per user.
--
-- favorite_exercises is the "saved" library — fully editable rows the coach
-- (or member) curates by hand. It was created ahead of this file; the
-- statement below is idempotent so the migration history stays complete.
CREATE TABLE IF NOT EXISTS public.favorite_exercises (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name    TEXT NOT NULL,
  youtube_url      TEXT,
  target_sets      INT,
  target_reps      INT,
  target_weight_kg NUMERIC,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS favorite_exercises_user_idx
  ON public.favorite_exercises (user_id);

-- The picker's second list is derived on the fly from past workout_plans, so
-- there is no row to delete when it fills up with typos and one-off names.
-- Hiding records the *name* as suppressed for that user; past workouts stay
-- untouched, the entry just stops appearing in the picker and manager lists.
CREATE TABLE IF NOT EXISTS public.hidden_exercises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One suppression per name per user, case-insensitive: the derived history is
-- deduped on lowercased names, so "Push Ups" and "push ups" are one entry.
CREATE UNIQUE INDEX IF NOT EXISTS hidden_exercises_user_name_idx
  ON public.hidden_exercises (user_id, lower(exercise_name));

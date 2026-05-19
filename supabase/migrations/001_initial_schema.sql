-- ============================================================
-- FitTogether — Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  is_coach      BOOLEAN NOT NULL DEFAULT false,
  is_member     BOOLEAN NOT NULL DEFAULT false,
  coach_id      UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────────
-- COACH REQUESTS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  coach_id    UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'denied')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, coach_id)
);

ALTER TABLE public.coach_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_requests_select"
  ON public.coach_requests FOR SELECT
  TO authenticated
  USING (member_id = auth.uid() OR coach_id = auth.uid());

CREATE POLICY "coach_requests_insert"
  ON public.coach_requests FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "coach_requests_update_coach"
  ON public.coach_requests FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "coach_requests_delete_member"
  ON public.coach_requests FOR DELETE
  TO authenticated
  USING (member_id = auth.uid());

-- ────────────────────────────────────────────────
-- SUPPLEMENT LIST
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplement_list (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.supplement_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplement_list_own"
  ON public.supplement_list FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────────
-- HEALTH LOGS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  weight_kg      NUMERIC(5,2),
  sleep_hours    NUMERIC(4,1),
  sleep_quality  INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  activity_notes TEXT,
  health_notes   TEXT,
  photo_url      TEXT,
  supplements    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user the coach of the log owner?
CREATE OR REPLACE FUNCTION public.is_my_coach(owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = owner_id
      AND coach_id = auth.uid()
  );
$$;

CREATE POLICY "health_logs_select"
  ON public.health_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_my_coach(user_id));

CREATE POLICY "health_logs_insert_own"
  ON public.health_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "health_logs_update_own"
  ON public.health_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "health_logs_delete_own"
  ON public.health_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────
-- WORKOUT PLANS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by           UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  for_user_id          UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  type                 TEXT NOT NULL CHECK (type IN ('full_body', 'individual')),
  youtube_url          TEXT,
  description          TEXT,
  cardio_type          TEXT,
  cardio_duration_mins INTEGER,
  cardio_notes         TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user the coach of target?
CREATE OR REPLACE FUNCTION public.is_my_member(target_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = target_id
      AND coach_id = auth.uid()
  );
$$;

CREATE POLICY "workout_plans_select"
  ON public.workout_plans FOR SELECT
  TO authenticated
  USING (
    for_user_id = auth.uid()
    OR created_by = auth.uid()
    OR public.is_my_coach(for_user_id)
  );

CREATE POLICY "workout_plans_insert"
  ON public.workout_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (for_user_id = auth.uid() OR public.is_my_member(for_user_id))
  );

CREATE POLICY "workout_plans_update"
  ON public.workout_plans FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "workout_plans_delete"
  ON public.workout_plans FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ────────────────────────────────────────────────
-- WORKOUT EXERCISES
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_name    TEXT NOT NULL,
  youtube_url      TEXT,
  target_sets      INTEGER,
  target_reps      INTEGER,
  target_weight_kg NUMERIC(5,2),
  order_index      INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_exercises_select"
  ON public.workout_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id
        AND (wp.for_user_id = auth.uid() OR wp.created_by = auth.uid() OR public.is_my_coach(wp.for_user_id))
    )
  );

CREATE POLICY "workout_exercises_insert"
  ON public.workout_exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND wp.created_by = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_update"
  ON public.workout_exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND wp.created_by = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_delete"
  ON public.workout_exercises FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND wp.created_by = auth.uid()
    )
  );

-- ────────────────────────────────────────────────
-- WORKOUT LOGS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  user_id          UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  completed        TEXT NOT NULL CHECK (completed IN ('yes', 'partial', 'no')),
  notes            TEXT,
  actual_exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_logs_select"
  ON public.workout_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_my_coach(user_id));

CREATE POLICY "workout_logs_insert"
  ON public.workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workout_logs_update"
  ON public.workout_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workout_logs_delete"
  ON public.workout_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────
-- MEAL PLANS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  for_user_id     UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  breakfast       TEXT,
  breakfast_notes TEXT,
  lunch           TEXT,
  lunch_notes     TEXT,
  dinner          TEXT,
  dinner_notes    TEXT,
  snacks          TEXT,
  snacks_notes    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_plans_select"
  ON public.meal_plans FOR SELECT
  TO authenticated
  USING (
    for_user_id = auth.uid()
    OR created_by = auth.uid()
    OR public.is_my_coach(for_user_id)
  );

CREATE POLICY "meal_plans_insert"
  ON public.meal_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (for_user_id = auth.uid() OR public.is_my_member(for_user_id))
  );

CREATE POLICY "meal_plans_update"
  ON public.meal_plans FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "meal_plans_delete"
  ON public.meal_plans FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ────────────────────────────────────────────────
-- MEAL LOGS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  user_id          UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  actual_breakfast TEXT,
  actual_lunch     TEXT,
  actual_dinner    TEXT,
  actual_snacks    TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_logs_select"
  ON public.meal_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_my_coach(user_id));

CREATE POLICY "meal_logs_insert"
  ON public.meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_logs_update"
  ON public.meal_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_logs_delete"
  ON public.meal_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────
-- STORAGE BUCKETS
-- Run these separately in the Supabase dashboard if the
-- SQL editor does not support storage schema commands.
-- ────────────────────────────────────────────────

-- Progress photos bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket (public so profile photos load without a signed URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: progress-photos
-- Users can upload to their own folder: progress-photos/{user_id}/...
CREATE POLICY "progress_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "progress_photos_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_my_coach((storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "progress_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: avatars (public bucket — just restrict writes)
CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

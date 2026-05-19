-- Allow coach to write health, workout, and meal logs for their members

-- health_logs: expand INSERT and UPDATE to include coach
DROP POLICY IF EXISTS "health_logs_insert_own" ON public.health_logs;
CREATE POLICY "health_logs_insert_own"
  ON public.health_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_my_member(user_id));

DROP POLICY IF EXISTS "health_logs_update_own" ON public.health_logs;
CREATE POLICY "health_logs_update_own"
  ON public.health_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_my_member(user_id));

-- workout_logs: expand INSERT and UPDATE to include coach
DROP POLICY IF EXISTS "workout_logs_insert" ON public.workout_logs;
CREATE POLICY "workout_logs_insert"
  ON public.workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_my_member(user_id));

DROP POLICY IF EXISTS "workout_logs_update" ON public.workout_logs;
CREATE POLICY "workout_logs_update"
  ON public.workout_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_my_member(user_id));

-- meal_logs: expand INSERT and UPDATE to include coach
DROP POLICY IF EXISTS "meal_logs_insert" ON public.meal_logs;
CREATE POLICY "meal_logs_insert"
  ON public.meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_my_member(user_id));

DROP POLICY IF EXISTS "meal_logs_update" ON public.meal_logs;
CREATE POLICY "meal_logs_update"
  ON public.meal_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_my_member(user_id));

-- Storage: allow coach to upload progress photos to their member's folder
DROP POLICY IF EXISTS "progress_photos_insert" ON storage.objects;
CREATE POLICY "progress_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_my_member((storage.foldername(name))[1]::uuid)
    )
  );

-- RPC function that accepts a coach request with elevated permissions.
-- SECURITY DEFINER bypasses RLS so it can update the member's profile row.
CREATE OR REPLACE FUNCTION public.accept_coach_request(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_coach_id  UUID;
BEGIN
  -- Only the coach on this request can accept it
  SELECT member_id, coach_id INTO v_member_id, v_coach_id
  FROM public.coach_requests
  WHERE id = request_id
    AND coach_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or you are not authorised to accept it';
  END IF;

  UPDATE public.coach_requests SET status = 'accepted' WHERE id = request_id;
  UPDATE public.profiles SET coach_id = v_coach_id, is_member = true  WHERE user_id = v_member_id;
  UPDATE public.profiles SET is_coach  = true                         WHERE user_id = v_coach_id;
END;
$$;

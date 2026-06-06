CREATE OR REPLACE FUNCTION public.super_admin_update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate target role
  IF new_role NOT IN ('admin', 'officer', 'manager', 'vendor') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update target profile
  UPDATE public.profiles
  SET role = new_role
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for ID: %', target_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.super_admin_update_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.super_admin_update_user_role(UUID, TEXT) TO authenticated, anon;

-- Migration: Security Settings and Rate Limiting
-- Date: 2025-10-26
-- Purpose: Add centralized security settings and enhanced rate limiting

-- Central app-level security settings (singleton table)
CREATE TABLE IF NOT EXISTS public.security_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,  -- singleton row
  max_login_attempts INT NOT NULL DEFAULT 5,
  block_minutes INT NOT NULL DEFAULT 30,
  allowed_email_domain TEXT,  -- optional allowlist, null = no restriction
  password_min_length INT NOT NULL DEFAULT 12,
  password_require_upper BOOLEAN DEFAULT TRUE,
  password_require_lower BOOLEAN DEFAULT TRUE,
  password_require_digit BOOLEAN DEFAULT TRUE,
  password_require_symbol BOOLEAN DEFAULT TRUE,
  session_timeout_minutes INT NOT NULL DEFAULT 30,
  mfa_required_roles TEXT[] DEFAULT ARRAY['admin', 'cmc', 'coordinator', 'sergeant', 'facilities_manager'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT only_one_row CHECK (id = TRUE)
);

-- Insert default settings
INSERT INTO public.security_settings (id) VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;

-- Enhance security_rate_limits table if it exists, or create it
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,  -- email or IP address
  attempts INT NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_security_rate_limits_identifier ON public.security_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_security_rate_limits_blocked_until ON public.security_rate_limits(blocked_until);

-- Enable RLS
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_settings (admin only)
CREATE POLICY security_settings_admin_read ON public.security_settings
  FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'coordinator', 'it_dcas')
    )
  );

CREATE POLICY security_settings_admin_update ON public.security_settings
  FOR UPDATE
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'coordinator', 'it_dcas')
    )
  );

-- RLS Policies for security_rate_limits (admin only)
CREATE POLICY security_rate_limits_admin_read ON public.security_rate_limits
  FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'coordinator', 'it_dcas')
    )
  );

CREATE POLICY security_rate_limits_admin_all ON public.security_rate_limits
  FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'coordinator', 'it_dcas')
    )
  );

-- Function to unblock an identifier
CREATE OR REPLACE FUNCTION public.unblock_identifier(p_identifier TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS(
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'coordinator', 'it_dcas')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Clear the block
  UPDATE public.security_rate_limits
  SET attempts = 0,
      blocked_until = NULL,
      updated_at = NOW()
  WHERE identifier = p_identifier;

  -- Log the unblock action
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    'unblock_identifier',
    'security_rate_limits',
    p_identifier,
    jsonb_build_object('identifier', p_identifier, 'unblocked_by', auth.uid())
  );
END;
$$;

COMMENT ON FUNCTION public.unblock_identifier(TEXT) IS 'Admin function to manually unblock a rate-limited identifier';

-- Function to check if identifier is blocked
CREATE OR REPLACE FUNCTION public.is_identifier_blocked(p_identifier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_blocked_until TIMESTAMPTZ;
BEGIN
  SELECT blocked_until INTO v_blocked_until
  FROM public.security_rate_limits
  WHERE identifier = p_identifier;

  RETURN (v_blocked_until IS NOT NULL AND v_blocked_until > NOW());
END;
$$;

COMMENT ON FUNCTION public.is_identifier_blocked(TEXT) IS 'Check if an identifier is currently blocked';

-- Function to increment login attempts
CREATE OR REPLACE FUNCTION public.increment_login_attempt(p_identifier TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_attempts INT;
  v_block_minutes INT;
  v_current_attempts INT;
BEGIN
  -- Get current security settings
  SELECT max_login_attempts, block_minutes 
  INTO v_max_attempts, v_block_minutes
  FROM public.security_settings
  WHERE id = TRUE;

  -- Insert or update rate limit record
  INSERT INTO public.security_rate_limits (identifier, attempts, last_attempt_at)
  VALUES (p_identifier, 1, NOW())
  ON CONFLICT (identifier) DO UPDATE
  SET attempts = security_rate_limits.attempts + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
  RETURNING attempts INTO v_current_attempts;

  -- Block if exceeded max attempts
  IF v_current_attempts >= v_max_attempts THEN
    UPDATE public.security_rate_limits
    SET blocked_until = NOW() + (v_block_minutes || ' minutes')::INTERVAL
    WHERE identifier = p_identifier;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.increment_login_attempt(TEXT) IS 'Increment login attempts and block if threshold exceeded';

-- Function to reset login attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_identifier TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.security_rate_limits
  SET attempts = 0,
      blocked_until = NULL,
      updated_at = NOW()
  WHERE identifier = p_identifier;
END;
$$;

COMMENT ON FUNCTION public.reset_login_attempts(TEXT) IS 'Reset login attempts after successful authentication';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.unblock_identifier(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_identifier_blocked(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_login_attempt(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_login_attempts(TEXT) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.security_settings IS 'Centralized security configuration (singleton table)';
COMMENT ON TABLE public.security_rate_limits IS 'Rate limiting state for login attempts and blocking';
COMMENT ON COLUMN public.security_settings.max_login_attempts IS 'Maximum failed login attempts before blocking';
COMMENT ON COLUMN public.security_settings.block_minutes IS 'Duration in minutes to block after max attempts exceeded';
COMMENT ON COLUMN public.security_settings.allowed_email_domain IS 'Optional email domain restriction (null = no restriction)';
COMMENT ON COLUMN public.security_settings.session_timeout_minutes IS 'Session timeout duration in minutes';
COMMENT ON COLUMN public.security_settings.mfa_required_roles IS 'Array of roles that require MFA';

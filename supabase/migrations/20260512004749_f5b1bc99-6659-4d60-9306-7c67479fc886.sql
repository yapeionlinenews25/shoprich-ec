
-- 1. Fix has_role permission denied
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- 2. Vendor applications
CREATE TABLE public.vendor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  requested_role app_role NOT NULL,
  business_name text NOT NULL,
  country text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  website text,
  expected_monthly_volume text,
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vendor_applications_role_chk CHECK (requested_role IN ('vendor','reseller')),
  CONSTRAINT vendor_applications_status_chk CHECK (status IN ('pending','approved','rejected'))
);
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own application" ON public.vendor_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own applications" ON public.vendor_applications
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage applications" ON public.vendor_applications
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vendor_applications_updated
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Notification preferences
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY,
  push_orders boolean NOT NULL DEFAULT true,
  email_orders boolean NOT NULL DEFAULT true,
  sms_orders boolean NOT NULL DEFAULT false,
  marketing_emails boolean NOT NULL DEFAULT false,
  phone text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notification_prefs_updated
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create prefs row on signup (extend existing handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, contact_email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- 4. Remove self-assign vendor/reseller policy
DROP POLICY IF EXISTS "Users can self-assign vendor or reseller" ON public.user_roles;

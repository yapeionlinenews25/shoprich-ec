-- supabase/migrations/001_create_vendor_tables.sql
-- Create vendor_profiles, vendor_documents, admin_reviews

BEGIN;

CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name text,
  slug text UNIQUE,
  country text,
  tax_id text,
  stripe_account_id text,
  status text DEFAULT 'pending', -- pending / approved / rejected
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_profiles_user_id_idx ON public.vendor_profiles(user_id);

CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_profile_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  key text NOT NULL, -- business_license, tax_certificate, id_front, id_back
  storage_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_documents_vendor_profile_id_idx ON public.vendor_documents(vendor_profile_id);

CREATE TABLE IF NOT EXISTS public.admin_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- approved / rejected / commented
  comment text,
  created_at timestamptz DEFAULT now()
);

COMMIT;

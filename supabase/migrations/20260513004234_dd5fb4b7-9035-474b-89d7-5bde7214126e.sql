
-- 1. Helper SECURITY DEFINER functions (bypass RLS to break recursion)
CREATE OR REPLACE FUNCTION public.is_order_customer(_order_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id AND customer_id = _uid)
$$;

CREATE OR REPLACE FUNCTION public.is_order_stakeholder(_order_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id AND customer_id = _uid)
    OR EXISTS (SELECT 1 FROM public.order_items WHERE order_id = _order_id AND (vendor_id = _uid OR reseller_id = _uid))
$$;

GRANT EXECUTE ON FUNCTION public.is_order_customer(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_order_stakeholder(uuid, uuid) TO authenticated, anon;

-- 2. Rewrite recursive policies on orders + order_items
DROP POLICY IF EXISTS "Customer sees own orders" ON public.orders;
DROP POLICY IF EXISTS "Admin updates orders" ON public.orders;
DROP POLICY IF EXISTS "Stakeholder sees order items" ON public.order_items;
DROP POLICY IF EXISTS "Customer inserts own order items" ON public.order_items;

CREATE POLICY "Stakeholder sees orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_order_stakeholder(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin or vendor updates orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.order_items WHERE order_id = orders.id AND vendor_id = auth.uid())
  );

CREATE POLICY "Stakeholder sees order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    vendor_id = auth.uid()
    OR reseller_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_order_customer(order_id, auth.uid())
  );

CREATE POLICY "Customer inserts own order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_order_customer(order_id, auth.uid()));

-- 3. Tighten profiles (currently leaks email/telegram_chat_id to everyone)
DROP POLICY IF EXISTS "Profiles readable by everyone" ON public.profiles;

CREATE POLICY "Owner or admin reads full profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Public-safe view for reviews / vendor pages (no PII)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, user_id, display_name, avatar_url, country, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Allow anyone to read the public-safe view fields via base table too
CREATE POLICY "Public-safe profile fields readable" ON public.profiles
  FOR SELECT TO anon
  USING (true);
-- Note: anon read is restricted by what the app queries; sensitive columns
-- should always be queried through profiles_public. Per Lovable rules we
-- leave this here ONLY because the app queries select(*); however to be
-- safe we'll drop this and force code to use the view:
DROP POLICY IF EXISTS "Public-safe profile fields readable" ON public.profiles;

-- 4. Mask payout account numbers for admins
CREATE OR REPLACE VIEW public.payout_accounts_admin
WITH (security_invoker = on) AS
SELECT
  id, user_id, country, type, bank_code, bank_name,
  ('****' || RIGHT(account_number, 4)) AS account_number_masked,
  account_name, currency, verified, paystack_recipient_code, is_default,
  created_at, updated_at
FROM public.payout_accounts;

GRANT SELECT ON public.payout_accounts_admin TO authenticated;

DROP POLICY IF EXISTS "Admin reads payout accounts" ON public.payout_accounts;
-- Owner-only access remains via "Own payout accounts"; admins use the masked view.

-- 5. Re-scope existing user policies to authenticated role explicitly
DROP POLICY IF EXISTS "Own cart items" ON public.cart_items;
CREATE POLICY "Own cart items" ON public.cart_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Own cart" ON public.carts;
CREATE POLICY "Own cart" ON public.carts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Own notifications update" ON public.notifications;
CREATE POLICY "Own notifications read" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notifications update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);


CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own push subs" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin reads push subs" ON public.push_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  country TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank','mobile_money')),
  bank_code TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT NOT NULL,
  account_name TEXT,
  currency TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  paystack_recipient_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own payout accounts" ON public.payout_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin reads payout accounts" ON public.payout_accounts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_payout_accounts_updated BEFORE UPDATE ON public.payout_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

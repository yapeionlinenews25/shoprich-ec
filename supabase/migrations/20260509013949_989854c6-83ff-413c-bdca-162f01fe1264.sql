
-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users insert own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own review" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own review" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_reviews_product ON public.reviews(product_id);

-- Telegram link tokens
CREATE TABLE public.telegram_link_tokens (
  token text PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);
ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own tokens" ON public.telegram_link_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own token" ON public.telegram_link_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Telegram messages log (for /start and commands)
CREATE TABLE public.telegram_messages (
  update_id bigint PRIMARY KEY,
  chat_id bigint NOT NULL,
  tg_user_id bigint,
  username text,
  text text,
  raw jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads telegram messages" ON public.telegram_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

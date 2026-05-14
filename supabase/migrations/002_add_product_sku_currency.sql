BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products (sku);

COMMIT;

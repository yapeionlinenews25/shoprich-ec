# ShopRich EC — Stabilization + Vendor/Reseller/Admin Upgrade

Big scope, so I've grouped the work into 4 phases. Phases 1–2 are fixes (must ship together). Phases 3–4 are features and can be reviewed step by step.

---

## Phase 1 — Stop the bleeding (DB fixes)

### 1.1 "infinite recursion detected in policy for relation orders"
Root cause confirmed: `orders.SELECT` checks `order_items` (vendor/reseller match), and `order_items.SELECT` checks `orders` (customer match). Postgres re-enters the other policy → recursion.

Fix: replace the cross-table EXISTS in both policies with `SECURITY DEFINER` helpers that bypass RLS:
- `public.is_order_customer(order_id, uid)` 
- `public.is_order_stakeholder(order_id, uid)` (vendor/reseller/customer/admin)
- Rewrite both SELECT policies and the `orders.UPDATE` policy to call these.

### 1.2 5 critical + 5 warning security findings
I'll run `security--run_security_scan` first thing to enumerate the exact list, then fix in the same migration. Expected items based on schema:
- `notifications` / `cart_items` / `commissions` missing scoped INSERT/UPDATE policies (or overly broad).
- Policies defaulting to `PUBLIC` instead of `TO authenticated` (so `auth.uid()` is null for anon).
- `profiles` exposes `contact_email` to everyone (`USING true`) → PII leak; restrict to owner + admin, or move email to a private view.
- `payout_accounts` admin SELECT exposes account numbers → mask via view.
- `telegram_link_tokens` readable rules + missing UPDATE-used policy.
- Linter warnings: function `search_path`, unused indexes, etc.

### 1.3 Account page breakdown on login
Almost certainly a fallout from (1.1) — `account.tsx` queries orders. I'll verify after the policy fix and also add `.maybeSingle()` + null-guards so a missing profile/role doesn't crash the page.

---

## Phase 2 — Cart UX + auth gate

- `Add to cart` for unauthenticated users → toast "Please sign in to continue" + redirect to `/auth?redirect=<current url>`. After login, push them back to that URL and (if it was a product page) auto-add the pending item stored in `sessionStorage`.
- Preserve reseller attribution (`?ref=<reseller_id>`) across the auth round-trip.

---

## Phase 3 — Vendor / Reseller / Storefront

### 3.1 Storage + profile avatars
- Buckets: `avatars` (public), `product-images` (public), `store-assets` (public, for vendor logos/banners).
- RLS: users write only to `{user_id}/...` paths; public read.
- Add avatar uploader to `/account`; display avatars in `Reviews.tsx` and product reviews.

### 3.2 Vendor product form upgrades
- Image upload (single + gallery, store URLs in `products.image_url` / new `product_images` table).
- `sku` field with auto-suggest (`<store-slug>-<random>`) + uniqueness check per vendor.
- Edit & delete actions on vendor dashboard product list.
- New `available_for_resale boolean` on `products` so vendors opt products into the reseller pool. Reseller marketplace filters on this flag.

### 3.3 Vendor storefront
- Public route `/store/$slug` rendering vendor branding (logo, banner, description) + their active products.
- Vendor dashboard "Storefront" tab to edit `vendor_stores` (logo upload via `store-assets`, name, slug, description, banner) and copy share link.
- Vendor analytics tab: revenue, orders, top products, 30-day chart (recharts — already used pattern). Data via a `vendor_stats` server fn aggregating `order_items`/`commissions` for `vendor_id = auth.uid()`.

### 3.4 Reseller upgrades
- Reseller "catalog" view of products where `available_for_resale = true`; "Add to my picks" generates a referral link `/products/$id?ref=<reseller_id>`.
- Reseller analytics: clicks (optional later), commissions earned, top products.

---

## Phase 4 — Payments, Admin, Telegram

### 4.1 Paystack/Stripe auto-routing for vendor & reseller payouts
- Reuse existing `PayoutSetup` (already does Paystack name resolve + recipient).
- Add country detection: if vendor/reseller country ∈ Paystack-supported list → Paystack flow; else show **Stripe Connect Express** onboarding (new `stripe.functions.ts`: `createConnectAccount`, `createOnboardingLink`, webhook to mark `verified`).
- New table `payout_provider_accounts` (or extend `payout_accounts`) with `provider ∈ ('paystack','stripe')`, `external_account_id`, `charges_enabled`, `payouts_enabled`.
- Checkout: pick provider per vendor on the order; reject checkout if any vendor in cart has no verified payout account (with clear message).
- Commission math (server-side, authoritative): for each line `vendor_payout = unit_price * (1 - platform_fee_pct/100 - reseller_commission_pct/100 if reseller else 1 - platform_fee_pct/100)`. Already partly there in `payments.functions.ts`; I'll lock it down so client cannot influence the split, and write `commissions` rows in the same transaction.

### 4.2 Admin dashboard
- Tabs: Overview (KPIs + charts: GMV, orders/day, new users/day), Users, Vendors, Resellers, Applications (existing), Settings.
- Per-tab tables with search, role assignment, suspend/activate, view their orders.
- Charts via recharts; data via admin-scoped server fns using `requireSupabaseAuth` + `has_role(uid,'admin')` check.

### 4.3 Telegram bot commands & inline keyboard
Extend existing webhook (`/api/public/telegram/webhook`) with command router:
- `/start` — welcome + inline buttons (My Orders, Browse, Link Account, Help).
- `/link <token>` — link Telegram chat to user account via existing `telegram_link_tokens`.
- `/orders` — last 5 orders for linked user (inline button → order detail link).
- `/track <order#>` — status lookup.
- `/help`, `/unlink`.
- All replies use `reply_markup` with `inline_keyboard` for tap-to-act buttons (deep links to the web app).

---

## Technical notes

- All DB changes go via `supabase--migration` (one migration for Phase 1, then per-phase migrations).
- New server fns live in `src/lib/*.functions.ts`, follow `requireSupabaseAuth` pattern.
- Storage uploads from client use the publishable key + RLS path checks.
- Stripe Connect requires `STRIPE_SECRET_KEY` (already set) + a Stripe webhook secret — I'll request it via `add_secret` when we reach Phase 4.1.
- No edits to `client.ts` / `types.ts` / `.env`.

---

## Suggested order of approval

1. **Approve Phase 1 + 2 now** — restores checkout, account page, fixes security, fixes cart UX. ~1 round.
2. Then Phase 3 (storefront/products/avatars).
3. Then Phase 4 (Stripe Connect + admin analytics + Telegram).

Reply "go" to start with Phase 1+2, or tell me to reorder/trim.

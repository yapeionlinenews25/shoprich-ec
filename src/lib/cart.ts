import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  reseller_id: string | null;
  // snapshot fields stored on the cart item
  unit_price: number;
  currency: string | null;
  sku: string | null;
  title: string | null;
  image_url: string | null;
  vendor_id: string | null;
  // keep legacy product mapping for code that expects it (nullable)
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string | null;
    stock: number;
    vendor_id: string;
  } | null;
};

export async function getOrCreateCart(userId: string) {
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export function useCart() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);

  const load = async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const id = await getOrCreateCart(user.id);
    setCartId(id);
    const { data } = await supabase
      .from("cart_items")
      .select(
        "id, product_id, quantity, reseller_id, unit_price, currency, sku, title, image_url, vendor_id, product:products(id,title,price,image_url,stock,vendor_id)"
      )
      .eq("cart_id", id);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Add: snapshot product fields (unit_price & currency & sku) into cart_items
  const add = async (productId: string, qty = 1, resellerId: string | null = null) => {
    if (!user) throw new Error("Sign in to add to cart");
    const id = cartId ?? (await getOrCreateCart(user.id));
    setCartId(id);

    // Fetch product snapshot
    const { data: p, error: pErr } = await supabase
      .from("products")
      .select("id, title, price, currency, sku, image_url, stock, vendor_id")
      .eq("id", productId)
      .maybeSingle();
    if (pErr) throw pErr;
    const unit_price = Number(p?.price ?? 0);
    const currency = p?.currency ?? "USD";

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity, unit_price, currency")
      .eq("cart_id", id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      // If already in cart: increment quantity (we do not change unit_price/currency here)
      await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: id,
        product_id: productId,
        quantity: qty,
        reseller_id: resellerId,
        unit_price,
        currency,
        sku: p?.sku ?? null,
        image_url: p?.image_url ?? null,
        title: p?.title ?? null,
        vendor_id: p?.vendor_id ?? null,
      });
    }
    await load();
  };

  const update = async (itemId: string, qty: number) => {
    if (qty <= 0) return remove(itemId);
    await supabase.from("cart_items").update({ quantity: qty }).eq("id", itemId);
    await load();
  };

  const remove = async (itemId: string) => {
    await supabase.from("cart_items").delete().eq("id", itemId);
    await load();
  };

  const clear = async () => {
    if (!cartId) return;
    await supabase.from("cart_items").delete().eq("cart_id", cartId);
    await load();
  };

  // subtotal is undefined for mixed-currency carts. We can compute platform-normalized subtotal
  // elsewhere in checkout. Here, provide a simple USD-subtotal for items that are USD (or fallback).
  const subtotal = items.reduce((s, i) => {
    const price = i.unit_price ?? 0;
    // only add if currency is USD (simple fallback), otherwise ignore here.
    return s + (i.currency === "USD" ? price * i.quantity : 0);
  }, 0);

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, loading, cartId, subtotal, count, add, update, remove, clear, reload: load };
}

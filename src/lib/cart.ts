import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  reseller_id: string | null;
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
      .select("id, product_id, quantity, reseller_id, product:products(id,title,price,image_url,stock,vendor_id)")
      .eq("cart_id", id);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const add = async (productId: string, qty = 1, resellerId: string | null = null) => {
    if (!user) throw new Error("Sign in to add to cart");
    const id = cartId ?? (await getOrCreateCart(user.id));
    setCartId(id);
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", id)
      .eq("product_id", productId)
      .maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ cart_id: id, product_id: productId, quantity: qty, reseller_id: resellerId });
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

  const subtotal = items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, loading, cartId, subtotal, count, add, update, remove, clear, reload: load };
}

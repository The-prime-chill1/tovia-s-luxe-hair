const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export async function createOrder(order) {
  if (!isSupabaseConfigured) {
    const savedOrders = JSON.parse(localStorage.getItem("tovia-demo-orders") || "[]");
    localStorage.setItem(
      "tovia-demo-orders",
      JSON.stringify([{ ...order, storedLocally: true }, ...savedOrders].slice(0, 20)),
    );
    return { ...order, storedLocally: true };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

  if (error) throw new Error(error.message || "We could not place your order. Please try again.");

  const createdOrder = data;
  return createdOrder;
}

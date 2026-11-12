const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
let clientPromise;

async function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) => createClient(supabaseUrl, supabaseAnonKey));
  }
  return clientPromise;
}

function requireConfiguredClient(client) {
  if (!client) throw new Error("Supabase is not configured. Add the project URL and anon key to .env.local.");
  return client;
}

function isAdmin(user) {
  return user?.app_metadata?.role === "admin";
}

const PRODUCT_BUCKET = "product-images";

function toStoreProduct(row, supabase) {
  const variants = (row.product_variants || []).sort((a, b) => a.sort_order - b.sort_order).map((variant) => ({
    id: variant.id,
    length: variant.length,
    normalPrice: Number(variant.normal_price),
    salePrice: Number(variant.sale_price),
  }));
  const images = (row.image_paths || []).map((path) => supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    badge: row.badge,
    laceType: row.lace_type || "Details available from Tovia’s",
    density: row.density || "See product description",
    imagePaths: row.image_paths || [],
    image: images[0] || "",
    images,
    variants,
    status: row.status,
    catalogReady: true,
    createdAt: row.created_at,
  };
}

export async function createOrder(order) {
  if (!isSupabaseConfigured) {
    const savedOrders = JSON.parse(localStorage.getItem("tovia-demo-orders") || "[]");
    localStorage.setItem(
      "tovia-demo-orders",
      JSON.stringify([{ ...order, storedLocally: true }, ...savedOrders].slice(0, 20)),
    );
    return { ...order, storedLocally: true };
  }

  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { error } = await supabase.from("orders").insert(order);

  if (error) throw new Error(error.message || "We could not place your order. Please try again.");
  return order;
}

export async function createMessage(message) {
  if (!isSupabaseConfigured) {
    const saved = JSON.parse(localStorage.getItem("tovia-demo-messages") || "[]");
    const created = { ...message, id: `MSG-${Date.now()}`, status: "unread", created_at: new Date().toISOString() };
    localStorage.setItem("tovia-demo-messages", JSON.stringify([created, ...saved]));
    return created;
  }
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { error } = await supabase.from("messages").insert(message);
  if (error) throw new Error(error.message || "We could not send your enquiry. Please try again.");
  return message;
}

export async function createReview(review) {
  if (!isSupabaseConfigured) {
    const saved = JSON.parse(localStorage.getItem("tovia-demo-reviews") || "[]");
    const created = { ...review, id: `REV-${Date.now()}`, status: "pending", created_at: new Date().toISOString() };
    localStorage.setItem("tovia-demo-reviews", JSON.stringify([created, ...saved]));
    return created;
  }
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { error } = await supabase.from("reviews").insert(review);
  if (error) throw new Error(error.message || "We could not submit your review. Please try again.");
  return review;
}

export async function fetchApprovedReviews() {
  if (!isSupabaseConfigured) {
    try { return JSON.parse(localStorage.getItem("tovia-demo-reviews") || "[]").filter((review) => review.status === "approved"); }
    catch { return []; }
  }
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data, error } = await supabase.from("reviews").select("*").eq("status", "approved").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function signInAdmin(email, password) {
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("The email or password is incorrect.");
  if (!isAdmin(data.user)) {
    await supabase.auth.signOut();
    throw new Error("This account does not have administrator access.");
  }
  return data.user;
}

export async function getCurrentAdmin() {
  if (!isSupabaseConfigured) return null;
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data, error } = await supabase.auth.getUser();
  if (error || !isAdmin(data.user)) return null;
  return data.user;
}

export async function signOutAdmin() {
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updateInvitedUserPassword(password) {
  if (password.length < 12) throw new Error("Use at least 12 characters for the admin password.");
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error?.message?.toLowerCase().includes("session missing")) {
    throw new Error("This password link is expired or has already been used. Request one new recovery email from the admin sign-in page.");
  }
  if (error) throw new Error(error.message || "The invitation link is invalid or has expired.");
  return data.user;
}

export async function hasPasswordSetupSession() {
  if (!isSupabaseConfigured) return false;
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data, error } = await supabase.auth.getSession();
  return !error && Boolean(data.session);
}

export async function sendAdminPasswordReset(email) {
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const redirectTo = `${window.location.origin}/admin/set-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error?.status === 429 || error?.code === "over_email_send_rate_limit") {
    throw new Error("Too many recovery emails were requested. Wait up to one hour, then request one new email.");
  }
  if (error) throw new Error("We could not send the recovery email. Please try again shortly.");
}

export async function fetchStoreProducts() {
  if (!isSupabaseConfigured) return [];
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data, error } = await supabase.from("products").select("*, product_variants(*)").eq("status", "active").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => toStoreProduct(row, supabase)).filter((product) => product.variants.length && product.images.length);
}

export async function fetchAdminData() {
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const [ordersResult, reviewsResult, messagesResult, productsResult] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }),
    supabase.from("messages").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*, product_variants(*)").order("created_at", { ascending: false }),
  ]);
  const error = ordersResult.error || reviewsResult.error || messagesResult.error || productsResult.error;
  if (error) throw new Error(error.message);
  return {
    orders: ordersResult.data || [],
    reviews: reviewsResult.data || [],
    messages: messagesResult.data || [],
    products: (productsResult.data || []).map((row) => toStoreProduct(row, supabase)),
  };
}

export async function updateAdminRecord(table, id, updates) {
  if (!["reviews", "messages", "orders"].includes(table)) throw new Error("Unsupported admin update.");
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data, error } = await supabase.from(table).update(updates).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function subscribeToAdminChanges(onChange) {
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const channel = supabase.channel("tovia-admin-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => onChange("orders", payload))
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => onChange("messages", payload))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function createAdminProduct(product, imageFiles) {
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !isAdmin(userData.user)) throw new Error("Administrator access is required.");

  const files = Array.from(imageFiles || []);
  if (!files.length) throw new Error("Choose at least one product image.");
  if (files.length > 5) throw new Error("Upload no more than five product images.");
  for (const file of files) {
    if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Each product image must be 5 MB or smaller.");
  }

  const imagePaths = [];
  try {
    for (const file of files) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
      const path = `${userData.user.id}/${crypto.randomUUID()}-${safeName || "product-image"}`;
      const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      imagePaths.push(path);
    }

    const slugBase = product.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
    const { data: created, error: productError } = await supabase.from("products").insert({
      slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
      name: product.name.trim(),
      category: product.category,
      description: product.description.trim(),
      badge: product.badge?.trim() || "NEW",
      lace_type: product.laceType?.trim() || null,
      density: product.density?.trim() || null,
      image_paths: imagePaths,
      status: product.status,
      created_by: userData.user.id,
    }).select("id").single();
    if (productError) throw productError;

    const { error: variantError } = await supabase.from("product_variants").insert({
      product_id: created.id,
      length: product.length.trim(),
      normal_price: Number(product.normalPrice),
      sale_price: Number(product.salePrice),
    });
    if (variantError) {
      await supabase.from("products").delete().eq("id", created.id);
      throw variantError;
    }

    const { data: completed, error: fetchError } = await supabase.from("products").select("*, product_variants(*)").eq("id", created.id).single();
    if (fetchError) throw fetchError;
    return toStoreProduct(completed, supabase);
  } catch (error) {
    if (imagePaths.length) await supabase.storage.from(PRODUCT_BUCKET).remove(imagePaths);
    throw new Error(error.message || "The product could not be saved.");
  }
}

export async function setAdminProductStatus(id, status) {
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { data, error } = await supabase.from("products").update({ status }).eq("id", id).select("*, product_variants(*)").single();
  if (error) throw new Error(error.message);
  return toStoreProduct(data, supabase);
}

export async function deleteAdminProduct(product) {
  const supabase = requireConfiguredClient(await getSupabaseClient());
  const { error } = await supabase.from("products").delete().eq("id", product.id);
  if (error) throw new Error(error.message);
  if (product.imagePaths?.length) await supabase.storage.from(PRODUCT_BUCKET).remove(product.imagePaths);
}

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Check,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { PRODUCTS } from "../data/products";
import { STORE_CONFIG } from "../data/storeConfig";
import { createAdminProduct, deleteAdminProduct, fetchAdminData, getCurrentAdmin, isSupabaseConfigured, sendAdminPasswordReset, setAdminProductStatus, signInAdmin, signOutAdmin, subscribeToAdminChanges, updateAdminRecord, updateInvitedUserPassword } from "../lib/supabase";

const tabs = [
  ["Overview", LayoutDashboard],
  ["Orders", ShoppingBag],
  ["Products", Package],
  ["Reviews", Star],
  ["Messages", MessageSquare],
  ["Customers", Users],
  ["Settings", Settings],
];

function EmptyState({ icon: Icon, title, text }) {
  return <div className="admin-empty"><span><Icon /></span><h3>{title}</h3><p>{text}</p></div>;
}

function AdminLogin({ onEnter }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");
  const [resetSent, setResetSent] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setLoading(true); setError("");
    try {
      if (mode === "reset") { await sendAdminPasswordReset(values.email); setResetSent(true); }
      else await onEnter(values.email, values.password);
    }
    catch (loginError) { setError(loginError.message); }
    finally { setLoading(false); }
  };
  return <main className="admin-login"><section><div className="admin-login-brand"><span>T</span><div><b>TOVIA’S</b><small>STORE ADMIN</small></div></div><span className="admin-kicker">Private workspace</span><h1>{mode === "reset" ? "Reset password." : "Welcome back."}</h1><p>{mode === "reset" ? "Enter either approved admin email and we’ll send a secure recovery link." : "Manage orders, products, reviews, and customer enquiries."}</p>{resetSent ? <div className="admin-password-success"><Check /><h2>Check your email.</h2><p>If this is an approved admin address, a recovery link is on its way.</p><button className="admin-primary" onClick={() => { setMode("login"); setResetSent(false); }}>Return to sign in</button></div> : <form onSubmit={submit}><label>Email address<input required name="email" type="email" autoComplete="username" placeholder="Admin email address" /></label>{mode === "login" && <label>Password<input required name="password" type="password" minLength="12" autoComplete="current-password" placeholder="Enter your password" /></label>}{error && <p className="admin-login-error">{error}</p>}<button disabled={loading || !isSupabaseConfigured} className="admin-primary">{loading ? "Please wait…" : mode === "reset" ? "Send recovery email" : "Sign in securely"} <ArrowRight /></button></form>}<button className="admin-forgot" type="button" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setError(""); setResetSent(false); }}>{mode === "login" ? "Forgot your password?" : "Return to sign in"}</button><small className="admin-demo-note">{isSupabaseConfigured ? "Protected by Supabase Auth and admin-only database policies." : "Supabase is not configured yet. Add the project URL and publishable key to .env.local."}</small><Link to="/">← Return to storefront</Link></section><aside><span>STORE CONTROL</span><h2>Everything your<br /><em>luxe business needs.</em></h2><div><p><Check /> Orders in one place</p><p><Check /> Real product uploads</p><p><Check /> Verified review moderation</p><p><Check /> Customer support inbox</p></div></aside></main>;
}

function AdminSetPassword() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.password !== values.confirm_password) { setError("The passwords do not match."); return; }
    setStatus("loading"); setError("");
    try { await updateInvitedUserPassword(values.password); setStatus("success"); }
    catch (passwordError) { setError(passwordError.message); setStatus("idle"); }
  };
  return <main className="admin-login"><section><div className="admin-login-brand"><span>T</span><div><b>TOVIA’S</b><small>STORE ADMIN</small></div></div><span className="admin-kicker">Admin invitation</span><h1>Set your password.</h1><p>Create a private password for your Tovia’s admin account. Use at least 12 characters.</p>{status === "success" ? <div className="admin-password-success"><Check /><h2>Password saved.</h2><p>Your account is ready. Sign in securely to continue.</p><Link className="admin-primary" to="/admin">Go to admin sign in <ArrowRight /></Link></div> : <form onSubmit={submit}><label>New password<input required name="password" type="password" minLength="12" autoComplete="new-password" /></label><label>Confirm password<input required name="confirm_password" type="password" minLength="12" autoComplete="new-password" /></label>{error && <p className="admin-login-error">{error}</p>}<button disabled={status === "loading" || !isSupabaseConfigured} className="admin-primary">{status === "loading" ? "Saving password…" : "Set password"} <ArrowRight /></button></form>}<small className="admin-demo-note">If this invitation link has expired, ask the store owner to send a new one.</small><Link to="/">← Return to storefront</Link></section><aside><span>WELCOME TO TOVIA’S</span><h2>Your secure<br /><em>workspace awaits.</em></h2><div><p><Check /> Protected account access</p><p><Check /> Private customer records</p><p><Check /> Review moderation</p><p><Check /> Order management</p></div></aside></main>;
}

export default function AdminDashboard() {
  const location = useLocation();
  const [authState, setAuthState] = useState("loading");
  const [adminUser, setAdminUser] = useState(null);
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [dataError, setDataError] = useState("");
  const [liveNotice, setLiveNotice] = useState(null);

  useEffect(() => {
    let activeRequest = true;
    getCurrentAdmin().then((user) => {
      if (!activeRequest) return;
      setAdminUser(user); setAuthState(user ? "authenticated" : "signed-out");
    }).catch(() => { if (activeRequest) setAuthState("signed-out"); });
    return () => { activeRequest = false; };
  }, []);

  useEffect(() => {
    if (authState !== "authenticated") return;
    let activeRequest = true;
    fetchAdminData().then((data) => {
      if (!activeRequest) return;
      setOrders(data.orders); setReviews(data.reviews); setMessages(data.messages); setProducts(data.products); setDataError("");
    }).catch((error) => { if (activeRequest) setDataError(error.message); });
    return () => { activeRequest = false; };
  }, [authState]);

  useEffect(() => {
    if (authState !== "authenticated") return;
    let unsubscribe;
    const upsert = (setter, row) => setter((current) => [row, ...current.filter((item) => item.id !== row.id)]);
    subscribeToAdminChanges((table, payload) => {
      const row = payload.new;
      if (!row?.id) return;
      if (table === "orders") upsert(setOrders, row);
      if (table === "messages") upsert(setMessages, row);
      if (payload.eventType === "INSERT") {
        setLiveNotice(table === "orders" ? `New order ${row.order_number} received` : `New message from ${row.name}`);
      }
    }).then((cleanup) => { unsubscribe = cleanup; }).catch((error) => setDataError(error.message));
    return () => { unsubscribe?.(); };
  }, [authState]);

  if (location.pathname === "/admin/set-password") return <AdminSetPassword />;
  if (authState === "loading") return <div className="admin-loading"><span>T</span><p>Checking secure access…</p></div>;
  if (authState !== "authenticated") return <AdminLogin onEnter={async (email, password) => { const user = await signInAdmin(email, password); setAdminUser(user); setAuthState("authenticated"); }} />;

  const choose = (tab) => { setActive(tab); setSidebarOpen(false); };
  const initials = adminUser?.email?.slice(0, 2).toUpperCase() || "TA";
  return <main className="admin-shell">
    {liveNotice && <div className="admin-live-toast"><Bell /><span><b>Live notification</b>{liveNotice}</span><button aria-label="Dismiss notification" onClick={() => setLiveNotice(null)}><X /></button></div>}
    <button className="admin-mobile-menu" aria-label="Open admin navigation" onClick={() => setSidebarOpen(true)}><Menu /></button>
    <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}><div className="admin-side-head"><div className="admin-login-brand"><span>T</span><div><b>TOVIA’S</b><small>STORE ADMIN</small></div></div><button aria-label="Close admin navigation" onClick={() => setSidebarOpen(false)}><X /></button></div><nav>{tabs.map(([label, Icon]) => { const count = label === "Orders" ? orders.length : label === "Reviews" ? reviews.filter((item) => item.status === "pending").length : label === "Messages" ? messages.filter((item) => item.status === "unread").length : 0; return <button key={label} className={active === label ? "active" : ""} onClick={() => choose(label)}><Icon />{label}{count > 0 && <b>{count}</b>}</button>; })}</nav><div className="admin-side-bottom"><Link to="/"><ArrowRight /> View storefront</Link><button onClick={async () => { await signOutAdmin(); setAdminUser(null); setAuthState("signed-out"); }}><LogOut /> Sign out</button></div></aside>
      {sidebarOpen && <button className="admin-side-shade" aria-label="Close admin navigation" onClick={() => setSidebarOpen(false)} />}
    <section className="admin-main"><header><div><span className="admin-kicker">Tovia’s Luxe Hairs</span><h1>{active}</h1></div><div className="admin-head-actions"><label><Search /><input aria-label="Search dashboard" placeholder="Search dashboard" /></label><button aria-label="Notifications"><Bell /><i /></button><div>{initials}</div></div></header>
      {dataError && <p className="admin-data-error">{dataError}</p>}
      {active === "Overview" && <AdminOverview orders={orders} reviews={reviews} messages={messages} productCount={products.length} onOpen={choose} />}
      {active === "Orders" && <OrdersView orders={orders} setOrders={setOrders} />}
      {active === "Products" && <ProductsView products={products} setProducts={setProducts} />}
      {active === "Reviews" && <ReviewsView reviews={reviews} setReviews={setReviews} />}
      {active === "Messages" && <MessagesView messages={messages} setMessages={setMessages} />}
      {active === "Customers" && <EmptyState icon={Users} title="No customer profiles yet" text="Customer records will be created securely from genuine orders." />}
      {active === "Settings" && <SettingsView />}
    </section>
  </main>;
}

function AdminOverview({ orders, reviews, messages, productCount, onOpen }) {
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const approvedReviews = reviews.filter((review) => review.status === "approved").length;
  const unreadMessages = messages.filter((message) => message.status === "unread").length;
  return <div className="admin-overview"><div className="admin-stats"><article><span>Orders</span><strong>{orders.length}</strong><small>Website orders</small></article><article><span>Revenue</span><strong>₦{total.toLocaleString("en-NG")}</strong><small>Recorded order value</small></article><article><span>Products</span><strong>{productCount}</strong><small>Database catalogue</small></article><article><span>Reviews</span><strong>{approvedReviews}</strong><small>Verified & published</small></article></div><div className="admin-overview-grid"><section className="admin-panel"><header><div><small>Recent activity</small><h2>Latest orders</h2></div><button onClick={() => onOpen("Orders")}>View all <ArrowRight /></button></header>{orders.length ? <div className="admin-order-list">{orders.slice(0,5).map((order) => <div key={order.order_number}><span>{order.customer_name?.slice(0,1) || "C"}</span><div><b>{order.customer_name}</b><small>{order.order_number}</small></div><strong>₦{Number(order.total || 0).toLocaleString("en-NG")}</strong><i>{order.order_status || "New"}</i></div>)}</div> : <EmptyState icon={ShoppingBag} title="No orders yet" text="New website orders will appear here instantly." />}</section><section className="admin-panel admin-launch"><small>Live operations</small><h2>Store workflow</h2><div><p><span><Check /></span><b>Secure admin access</b><i>Active</i></p><p><span><Check /></span><b>Realtime orders</b><i>Active</i></p><p><span><Check /></span><b>Product uploads</b><i>Active</i></p><p><span><Check /></span><b>Customer follow-up</b><i>Ready</i></p></div><Link to="/shop">Preview catalogue <ArrowRight /></Link></section></div><section className="admin-quick"><header><small>Quick actions</small><h2>What would you like to do?</h2></header><div><button onClick={() => onOpen("Products")}><Package /><span><b>Manage products</b><small>Upload images and publish goods</small></span><ArrowRight /></button><button onClick={() => onOpen("Orders")}><ShoppingBag /><span><b>Review orders</b><small>Contact customers and update status</small></span><ArrowRight /></button><button onClick={() => onOpen("Messages")}><MessageSquare /><span><b>Open messages</b><small>{unreadMessages ? `${unreadMessages} unread enquir${unreadMessages === 1 ? "y" : "ies"}` : "Reply to enquiries"}</small></span><ArrowRight /></button></div></section></div>;
}

function OrdersView({ orders, setOrders }) {
  const [query, setQuery] = useState("");
  const filtered = orders.filter((order) => `${order.customer_name} ${order.order_number}`.toLowerCase().includes(query.toLowerCase()));
  const update = async (id, changes) => {
    const updated = await updateAdminRecord("orders", id, changes);
    setOrders((current) => current.map((order) => order.id === id ? updated : order));
  };
  return <section className="admin-page-panel"><div className="admin-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders" /></label><p>Contact customers before confirming payment and delivery.</p></div>{filtered.length ? <div className="admin-table"><div className="admin-table-head"><span>Order</span><span>Customer</span><span>Total</span><span>Payment</span><span>Status</span></div>{filtered.map((order) => <div key={order.order_number}><span><b>{order.order_number}</b><small>{order.created_at ? new Date(order.created_at).toLocaleString() : "Local preview"}</small></span><span><b>{order.customer_name}</b><a href={`tel:${order.phone}`}>{order.phone}</a><small>{order.email}</small></span><span>₦{Number(order.total || 0).toLocaleString("en-NG")}</span><select aria-label={`Payment status for ${order.order_number}`} value={order.payment_status} onChange={(event) => update(order.id, { payment_status: event.target.value })}><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select><select aria-label={`Order status for ${order.order_number}`} value={order.order_status} onChange={(event) => update(order.id, { order_status: event.target.value })}><option value="new">New</option><option value="contacted">Contacted</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="dispatched">Dispatched</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>)}</div> : <EmptyState icon={ShoppingBag} title="No matching orders" text="Orders placed through the storefront will appear here instantly." />}</section>;
}

function ProductsView({ products, setProducts }) {
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const categories = [...new Set(PRODUCTS.map((product) => product.category))];
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setSaving(true); setError(""); setSaved(false);
    try {
      const created = await createAdminProduct({
        name: values.name,
        category: values.category,
        description: values.description,
        badge: values.badge,
        laceType: values.lace_type,
        density: values.density,
        status: values.status,
        length: values.length,
        normalPrice: values.normal_price,
        salePrice: values.sale_price,
      }, form.elements.images.files);
      setProducts((current) => [created, ...current]);
      setEditing(null); setSaved(true);
    } catch (submitError) { setError(submitError.message); }
    finally { setSaving(false); }
  };
  const changeStatus = async (product, status) => {
    const updated = await setAdminProductStatus(product.id, status);
    setProducts((current) => current.map((item) => item.id === product.id ? updated : item));
  };
  const remove = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    await deleteAdminProduct(product);
    setProducts((current) => current.filter((item) => item.id !== product.id));
  };
  return <section className="admin-page-panel"><div className="admin-toolbar"><p>{products.length} database product{products.length === 1 ? "" : "s"}</p><button onClick={() => { setSaved(false); setError(""); setEditing({}); }}>Add product</button></div>{saved && <p className="admin-inline-success"><Check /> Product and images saved securely.</p>}<div className="admin-product-grid">{products.map((product, index) => <article key={product.id}><div>{product.image ? <img src={product.image} alt="" /> : <Package />}<span>{String(index + 1).padStart(2,"0")}</span></div><small>{product.category}</small><h3>{product.name}</h3><p>{product.variants[0] ? `From ₦${product.variants[0].salePrice.toLocaleString("en-NG")}` : "No price added"}</p><div className="admin-product-foot"><select aria-label={`Status for ${product.name}`} value={product.status} onChange={(event) => changeStatus(product, event.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="sold_out">Sold out</option></select><button className="admin-delete-product" onClick={() => remove(product)}><Trash2 /> Delete</button></div></article>)}</div>{!products.length && <EmptyState icon={Package} title="No products uploaded yet" text="Use Add product to upload the first product and its real images." />}{editing && <div className="admin-modal-wrap" onMouseDown={() => setEditing(null)}><form className="admin-product-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><div><small>New catalogue item</small><h2>Add a product</h2></div><button type="button" aria-label="Close product editor" onClick={() => setEditing(null)}><X /></button></header><label>Product name<input required name="name" placeholder="Official product name" /></label><div className="admin-modal-grid"><label>Category<select required name="category" defaultValue={categories[0]}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Badge<input name="badge" defaultValue="NEW" placeholder="NEW or 10% OFF" /></label></div><label>Description<textarea required name="description" placeholder="Product description and care details" /></label><div className="admin-modal-grid"><label>Lace type<input name="lace_type" placeholder="e.g. 13x4 HD lace" /></label><label>Density<input name="density" placeholder="e.g. 250% density" /></label></div><div className="admin-modal-grid"><label>Length<input required name="length" placeholder="e.g. 18 inches" /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="active">Active</option><option value="sold_out">Sold out</option></select></label></div><div className="admin-modal-grid"><label>Original price<input required name="normal_price" type="number" min="0" step="1" placeholder="170000" /></label><label>Discount price<input required name="sale_price" type="number" min="0" step="1" placeholder="153000" /></label></div><label className="admin-file-label">Product images<input required name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /><small>Upload up to five JPG, PNG, or WebP files. Maximum 5 MB each.</small></label>{error && <p className="admin-login-error">{error}</p>}<button disabled={saving} className="admin-primary">{saving ? "Uploading and saving…" : "Save product"}</button></form></div>}</section>;
}

function ReviewsView({ reviews, setReviews }) {
  const update = async (id, status) => {
    const updated = await updateAdminRecord("reviews", id, { status });
    setReviews((current) => current.map((review) => review.id === id ? updated : review));
  };
  return <section className="admin-page-panel">{reviews.length ? <div className="admin-review-list">{reviews.map((review) => <article key={review.id}><header><div><span>{review.customer_name?.slice(0,1) || "C"}</span><div><b>{review.customer_name}</b><small>{review.order_number} · {new Date(review.created_at).toLocaleDateString()}</small></div></div><i className={`admin-pill ${review.status === "pending" ? "pending" : "new"}`}>{review.status}</i></header><div className="admin-review-stars">{"★".repeat(Number(review.rating || 0))}{"☆".repeat(5-Number(review.rating || 0))}</div><p>{review.review}</p>{review.status === "pending" && <div className="admin-review-actions"><button onClick={() => update(review.id,"rejected")}>Reject</button><button onClick={() => update(review.id,"approved")}><Check /> Approve review</button></div>}</article>)}</div> : <EmptyState icon={Star} title="No reviews awaiting moderation" text="Verified customer submissions will appear here before they are published." />}</section>;
}

function MessagesView({ messages, setMessages }) {
  const openMessage = async (id) => {
    const message = messages.find((item) => item.id === id);
    if (!message || message.status === "read") return;
    const updated = await updateAdminRecord("messages", id, { status: "read" });
    setMessages((current) => current.map((item) => item.id === id ? updated : item));
  };
  return <section className="admin-page-panel">{messages.length ? <div className="admin-message-list">{messages.map((message) => <button key={message.id} className={message.status === "unread" ? "unread" : ""} onClick={() => openMessage(message.id)}><span>{message.name?.slice(0,1) || "C"}</span><div><header><b>{message.name}</b><small>{new Date(message.created_at).toLocaleDateString()}</small></header><strong>{message.topic}</strong><p>{message.message}</p><i>{message.phone}</i></div></button>)}</div> : <EmptyState icon={MessageSquare} title="Your inbox is clear" text="Storefront contact enquiries will appear here." />}</section>;
}

function SettingsView() {
  const [saved, setSaved] = useState(false);
  return <form className="admin-settings" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}><section><small>Store identity</small><h2>Brand information</h2><div className="admin-form-grid"><label>Store name<input defaultValue={STORE_CONFIG.name} /></label><label>Phone number<input defaultValue={STORE_CONFIG.displayPhone} /></label><label>Instagram<input defaultValue={STORE_CONFIG.instagramHandle} /></label><label>TikTok<input defaultValue={STORE_CONFIG.tiktokHandle} /></label></div></section><section><small>Sale campaign</small><h2>Offer settings</h2><div className="admin-form-grid"><label>Sale title<input defaultValue={STORE_CONFIG.saleTitle} /></label><label>Discount<input defaultValue={`${STORE_CONFIG.saleDiscountPercent}%`} /></label><label>Sale dates<input defaultValue={STORE_CONFIG.saleDates} /></label><label>Delivery dates<input defaultValue={STORE_CONFIG.deliveryDates} /></label></div></section>{saved && <p className="admin-saved"><Check /> Settings saved in the frontend preview.</p>}<button className="admin-primary">Save changes</button></form>;
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Camera,
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
  Users,
  X,
} from "lucide-react";
import { PRODUCTS } from "../data/products";
import { STORE_CONFIG } from "../data/storeConfig";

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
  return <main className="admin-login"><section><div className="admin-login-brand"><span>T</span><div><b>TOVIA’S</b><small>STORE ADMIN</small></div></div><span className="admin-kicker">Private workspace</span><h1>Welcome back.</h1><p>Manage the Tovia’s online store, orders, catalogue, reviews, and customer enquiries.</p><form onSubmit={(event) => { event.preventDefault(); onEnter(); }}><label>Email address<input required type="email" placeholder="admin@toviasluxehairs.com" /></label><label>Password<input required type="password" minLength="6" placeholder="Enter your password" /></label><button className="admin-primary">Enter demo dashboard <ArrowRight /></button></form><small className="admin-demo-note">Frontend preview only. Secure authentication will be connected during backend setup.</small><Link to="/">← Return to storefront</Link></section><aside><span>STORE CONTROL</span><h2>Everything your<br /><em>luxe business needs.</em></h2><div><p><Check /> Orders in one place</p><p><Check /> Catalogue management</p><p><Check /> Verified review moderation</p><p><Check /> Customer support inbox</p></div></aside></main>;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem("tovia-admin-preview") === "true");
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const orders = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("tovia-demo-orders") || "[]"); }
    catch { return []; }
  }, []);
  const [reviews, setReviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tovia-demo-reviews") || "[]"); }
    catch { return []; }
  });
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tovia-demo-messages") || "[]"); }
    catch { return []; }
  });

  if (!authenticated) return <AdminLogin onEnter={() => { sessionStorage.setItem("tovia-admin-preview", "true"); setAuthenticated(true); }} />;

  const choose = (tab) => { setActive(tab); setSidebarOpen(false); };
  return <main className="admin-shell">
    <button className="admin-mobile-menu" aria-label="Open admin navigation" onClick={() => setSidebarOpen(true)}><Menu /></button>
    <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}><div className="admin-side-head"><div className="admin-login-brand"><span>T</span><div><b>TOVIA’S</b><small>STORE ADMIN</small></div></div><button aria-label="Close admin navigation" onClick={() => setSidebarOpen(false)}><X /></button></div><nav>{tabs.map(([label, Icon]) => { const count = label === "Orders" ? orders.length : label === "Reviews" ? reviews.filter((item) => item.status === "pending").length : label === "Messages" ? messages.filter((item) => item.status === "unread").length : 0; return <button key={label} className={active === label ? "active" : ""} onClick={() => choose(label)}><Icon />{label}{count > 0 && <b>{count}</b>}</button>; })}</nav><div className="admin-side-bottom"><Link to="/"><ArrowRight /> View storefront</Link><button onClick={() => { sessionStorage.removeItem("tovia-admin-preview"); setAuthenticated(false); }}><LogOut /> Sign out</button></div></aside>
      {sidebarOpen && <button className="admin-side-shade" aria-label="Close admin navigation" onClick={() => setSidebarOpen(false)} />}
    <section className="admin-main"><header><div><span className="admin-kicker">Tovia’s Luxe Hairs</span><h1>{active}</h1></div><div className="admin-head-actions"><label><Search /><input aria-label="Search dashboard" placeholder="Search dashboard" /></label><button aria-label="Notifications"><Bell /><i /></button><div>TA</div></div></header>
      {active === "Overview" && <AdminOverview orders={orders} reviews={reviews} messages={messages} onOpen={choose} />}
      {active === "Orders" && <OrdersView orders={orders} />}
      {active === "Products" && <ProductsView />}
      {active === "Reviews" && <ReviewsView reviews={reviews} setReviews={setReviews} />}
      {active === "Messages" && <MessagesView messages={messages} setMessages={setMessages} />}
      {active === "Customers" && <EmptyState icon={Users} title="No customer profiles yet" text="Customer records will be created securely from genuine orders." />}
      {active === "Settings" && <SettingsView />}
    </section>
  </main>;
}

function AdminOverview({ orders, reviews, messages, onOpen }) {
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const approvedReviews = reviews.filter((review) => review.status === "approved").length;
  const unreadMessages = messages.filter((message) => message.status === "unread").length;
  return <div className="admin-overview"><div className="admin-stats"><article><span>Orders</span><strong>{orders.length}</strong><small>Website orders</small></article><article><span>Revenue</span><strong>₦{total.toLocaleString("en-NG")}</strong><small>Recorded order value</small></article><article><span>Products</span><strong>{PRODUCTS.length}</strong><small>Awaiting final assets</small></article><article><span>Reviews</span><strong>{approvedReviews}</strong><small>Verified & published</small></article></div><div className="admin-overview-grid"><section className="admin-panel"><header><div><small>Recent activity</small><h2>Latest orders</h2></div><button onClick={() => onOpen("Orders")}>View all <ArrowRight /></button></header>{orders.length ? <div className="admin-order-list">{orders.slice(0,5).map((order) => <div key={order.order_number}><span>{order.customer_name?.slice(0,1) || "C"}</span><div><b>{order.customer_name}</b><small>{order.order_number}</small></div><strong>₦{Number(order.total || 0).toLocaleString("en-NG")}</strong><i>{order.order_status || "New"}</i></div>)}</div> : <EmptyState icon={ShoppingBag} title="No orders yet" text="New website orders will be shown here." />}</section><section className="admin-panel admin-launch"><small>Launch readiness</small><h2>Store setup</h2><div><p><span><Check /></span><b>Frontend routes</b><i>Complete</i></p><p><span><Check /></span><b>Responsive design</b><i>Complete</i></p><p><span>3</span><b>Product content</b><i>Waiting</i></p><p><span>4</span><b>Payment & backend</b><i>Later</i></p></div><Link to="/shop">Preview catalogue <ArrowRight /></Link></section></div><section className="admin-quick"><header><small>Quick actions</small><h2>What would you like to do?</h2></header><div><button onClick={() => onOpen("Products")}><Package /><span><b>Manage products</b><small>Add final images and prices</small></span><ArrowRight /></button><button onClick={() => onOpen("Orders")}><ShoppingBag /><span><b>Review orders</b><small>Track incoming sales</small></span><ArrowRight /></button><button onClick={() => onOpen("Messages")}><MessageSquare /><span><b>Open messages</b><small>{unreadMessages ? `${unreadMessages} unread enquir${unreadMessages === 1 ? "y" : "ies"}` : "Reply to enquiries"}</small></span><ArrowRight /></button></div></section></div>;
}

function OrdersView({ orders }) {
  const [query, setQuery] = useState("");
  const filtered = orders.filter((order) => `${order.customer_name} ${order.order_number}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-page-panel"><div className="admin-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders" /></label><button>Export orders</button></div>{filtered.length ? <div className="admin-table"><div className="admin-table-head"><span>Order</span><span>Customer</span><span>Total</span><span>Payment</span><span>Status</span></div>{filtered.map((order) => <div key={order.order_number}><span><b>{order.order_number}</b><small>{order.created_at ? new Date(order.created_at).toLocaleDateString() : "Local preview"}</small></span><span><b>{order.customer_name}</b><small>{order.phone}</small></span><span>₦{Number(order.total || 0).toLocaleString("en-NG")}</span><span className="admin-pill pending">{order.payment_status || "Pending"}</span><span className="admin-pill new">{order.order_status || "New"}</span></div>)}</div> : <EmptyState icon={ShoppingBag} title="No matching orders" text="Orders placed through the storefront will appear in this workspace." />}</section>;
}

function ProductsView() {
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  return <section className="admin-page-panel"><div className="admin-toolbar"><p>{PRODUCTS.length} catalogue placeholders</p><button onClick={() => { setSaved(false); setEditing({}); }}>Add product</button></div>{saved && <p className="admin-inline-success"><Check /> Product draft saved in this frontend preview.</p>}<div className="admin-product-grid">{PRODUCTS.map((product, index) => <article key={product.id}><div><Package /><span>{String(index + 1).padStart(2,"0")}</span></div><small>{product.category}</small><h3>{product.name}</h3><p>Awaiting owner-supplied image and confirmed pricing.</p><div className="admin-product-foot"><span>Draft</span><button onClick={() => { setSaved(false); setEditing(product); }}>Edit product</button></div></article>)}</div>{editing && <div className="admin-modal-wrap" onMouseDown={() => setEditing(null)}><form className="admin-product-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); setEditing(null); setSaved(true); }}><header><div><small>{editing.id ? "Edit catalogue item" : "New catalogue item"}</small><h2>{editing.id ? "Product details" : "Add a product"}</h2></div><button type="button" aria-label="Close product editor" onClick={() => setEditing(null)}><X /></button></header><label>Product name<input required defaultValue={editing.name || ""} placeholder="Official product name" /></label><label>Category<select defaultValue={editing.category || "Bone Straight"}>{[...new Set(PRODUCTS.map((product) => product.category))].map((category) => <option key={category}>{category}</option>)}</select></label><div className="admin-modal-grid"><label>Starting price<input type="number" min="0" placeholder="Confirmed price" /></label><label>Status<select defaultValue="Draft"><option>Draft</option><option>Active</option><option>Sold out</option></select></label></div><label>Description<textarea defaultValue={editing.description || ""} placeholder="Confirmed product description" /></label><div className="admin-upload"><Camera /><div><b>Product images</b><small>Upload will activate with storage setup.</small></div><button type="button">Choose files</button></div><button className="admin-primary">Save product draft</button></form></div>}</section>;
}

function ReviewsView({ reviews, setReviews }) {
  const update = (id, status) => {
    const next = reviews.map((review) => review.id === id ? { ...review, status } : review);
    setReviews(next); localStorage.setItem("tovia-demo-reviews", JSON.stringify(next));
  };
  return <section className="admin-page-panel">{reviews.length ? <div className="admin-review-list">{reviews.map((review) => <article key={review.id}><header><div><span>{review.customer_name?.slice(0,1) || "C"}</span><div><b>{review.customer_name}</b><small>{review.order_number} · {new Date(review.created_at).toLocaleDateString()}</small></div></div><i className={`admin-pill ${review.status === "pending" ? "pending" : "new"}`}>{review.status}</i></header><div className="admin-review-stars">{"★".repeat(Number(review.rating || 0))}{"☆".repeat(5-Number(review.rating || 0))}</div><p>{review.review}</p>{review.status === "pending" && <div className="admin-review-actions"><button onClick={() => update(review.id,"rejected")}>Reject</button><button onClick={() => update(review.id,"approved")}><Check /> Approve review</button></div>}</article>)}</div> : <EmptyState icon={Star} title="No reviews awaiting moderation" text="Verified customer submissions will appear here before they are published." />}</section>;
}

function MessagesView({ messages, setMessages }) {
  const openMessage = (id) => {
    const next = messages.map((message) => message.id === id ? { ...message, status: "read" } : message);
    setMessages(next); localStorage.setItem("tovia-demo-messages", JSON.stringify(next));
  };
  return <section className="admin-page-panel">{messages.length ? <div className="admin-message-list">{messages.map((message) => <button key={message.id} className={message.status === "unread" ? "unread" : ""} onClick={() => openMessage(message.id)}><span>{message.name?.slice(0,1) || "C"}</span><div><header><b>{message.name}</b><small>{new Date(message.created_at).toLocaleDateString()}</small></header><strong>{message.topic}</strong><p>{message.message}</p><i>{message.phone}</i></div></button>)}</div> : <EmptyState icon={MessageSquare} title="Your inbox is clear" text="Storefront contact enquiries will appear here." />}</section>;
}

function SettingsView() {
  const [saved, setSaved] = useState(false);
  return <form className="admin-settings" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}><section><small>Store identity</small><h2>Brand information</h2><div className="admin-form-grid"><label>Store name<input defaultValue={STORE_CONFIG.name} /></label><label>Phone number<input defaultValue={STORE_CONFIG.displayPhone} /></label><label>Instagram<input defaultValue={STORE_CONFIG.instagramHandle} /></label><label>TikTok<input defaultValue={STORE_CONFIG.tiktokHandle} /></label></div></section><section><small>Sale campaign</small><h2>Offer settings</h2><div className="admin-form-grid"><label>Sale title<input defaultValue={STORE_CONFIG.saleTitle} /></label><label>Discount<input defaultValue={`${STORE_CONFIG.saleDiscountPercent}%`} /></label><label>Sale dates<input defaultValue={STORE_CONFIG.saleDates} /></label><label>Delivery dates<input defaultValue={STORE_CONFIG.deliveryDates} /></label></div></section>{saved && <p className="admin-saved"><Check /> Settings saved in the frontend preview.</p>}<button className="admin-primary">Save changes</button></form>;
}

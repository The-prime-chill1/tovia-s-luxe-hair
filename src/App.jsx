import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Gift,
  Heart,
  Camera,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
} from "lucide-react";
import { CATEGORIES, PRODUCTS } from "./data/products";
import { STORE_CONFIG } from "./data/storeConfig";
import { createOrder, isSupabaseConfigured } from "./lib/supabase";

const AdminDashboard = lazy(() => import("./components/AdminDashboard"));

const formatMoney = (amount) => `${STORE_CONFIG.currency}${amount.toLocaleString("en-NG")}`;
const deliveryFeeFor = (subtotal) => (subtotal >= STORE_CONFIG.freeDeliveryThreshold ? 0 : 5000);
const CATALOG_PENDING = !STORE_CONFIG.catalogReady;

function BrandMark() {
  return (
    <span className="brand-lockup" aria-hidden="true">
      <span className="brand-word">T<span className="brand-o"><svg viewBox="0 0 44 62"><path className="brand-crown" d="M8 15 5 5l9 7 8-11 8 11 9-7-3 10H8Zm1 4h26"/><path d="M24 22c-9 6-14 14-13 23 1 8 6 13 13 16-5-5-7-10-5-16 2-7 9-10 10-17 1-4-1-7-5-10v4Z"/><path d="M28 24c7 6 9 13 6 21-2 5-6 9-11 12 4-5 5-9 3-14-2-5-5-8-4-12 0-3 2-5 6-7Z" opacity=".72"/></svg></span>VIA’S</span>
      <span className="brand-sub">LUXE HAIRS</span>
      <small>LUXURY IN EVERY STRANDS</small>
    </span>
  );
}

function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Tovia's Luxe Hairs home">
      <BrandMark />
    </Link>
  );
}

function Header({ cartCount, wishlistCount, onCartOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [["Shop", "/shop"], ["Sale", "/sale"], ["Our quality", "/quality"], ["Hair guide", "/hair-guide"], ["Contact", "/contact"]];
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <div className="announcement"><Sparkles size={13} /> 10% off every hair · November 24 — December 3 <Sparkles size={13} /></div>
      <header className="site-header">
        <div className="nav-shell">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
          <Logo />
          <nav className="desktop-nav">{links.map(([label, href]) => <NavLink key={label} to={href} className={({ isActive }) => isActive ? "active" : ""}>{label}</NavLink>)}</nav>
          <div className="nav-actions">
            <Link className="icon-button desktop-only" to="/shop" aria-label="Search products"><Search /></Link>
            <Link className="wishlist-button" to="/wishlist" aria-label={`Wishlist with ${wishlistCount} items`}><Heart />{wishlistCount > 0 && <b>{wishlistCount}</b>}</Link>
            <button className="bag-button" onClick={onCartOpen} aria-label={`Open bag with ${cartCount} items`}>
              <ShoppingBag /><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-head"><Logo /><button className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X /></button></div>
          <nav>{links.map(([label, href]) => <NavLink key={label} to={href} className={({ isActive }) => isActive ? "active" : ""} onClick={() => setMenuOpen(false)}>{label}<ArrowRight /></NavLink>)}</nav>
          <p>Premium raw & virgin human hair, thoughtfully sourced and beautifully finished.</p>
        </div>
      )}
    </>
  );
}

function MobileDock({ cartCount, wishlistCount, onCartOpen }) {
  return <nav className="mobile-dock" aria-label="Mobile navigation"><NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}><Sparkles /><span>Home</span></NavLink><NavLink to="/shop" className={({ isActive }) => isActive ? "active" : ""}><Search /><span>Shop</span></NavLink><NavLink to="/wishlist" className={({ isActive }) => isActive ? "active" : ""}><Heart /><span>Saved</span>{wishlistCount > 0 && <b>{wishlistCount}</b>}</NavLink><NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""}><Camera /><span>Contact</span></NavLink><button onClick={onCartOpen}><ShoppingBag /><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</button></nav>;
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <button className={`back-to-top ${visible ? "visible" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ChevronDown /></button>;
}

function SaleCountdown() {
  const getState = () => {
    const now = Date.now();
    const start = new Date("2026-11-24T00:00:00+01:00").getTime();
    const end = new Date("2026-12-04T00:00:00+01:00").getTime();
    const target = now < start ? start : end;
    const distance = Math.max(0, target - now);
    return { phase: now < start ? "Sale starts in" : now < end ? "Sale ends in" : "Sale ended", distance };
  };
  const [timer, setTimer] = useState(getState);
  useEffect(() => {
    const interval = window.setInterval(() => setTimer(getState()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const unit = (divisor) => Math.floor(timer.distance / divisor);
  const days = unit(86400000);
  const hours = unit(3600000) % 24;
  const minutes = unit(60000) % 60;
  const seconds = unit(1000) % 60;
  return <div className="sale-countdown"><small>{timer.phase}</small>{timer.distance > 0 ? <div>{[[days,"Days"],[hours,"Hours"],[minutes,"Mins"],[seconds,"Secs"]].map(([value,label]) => <span key={label}><b>{String(value).padStart(2,"0")}</b><i>{label}</i></span>)}</div> : <Link to="/shop">Explore the collection <ArrowRight /></Link>}</div>;
}

function Hero() {
  return (
    <main id="top" className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span /> Tovia’s first-ever mega sale</div>
        <h1>Your crown,<br /><em>only more luxurious.</em></h1>
        <p>Flawless raw and virgin human hair created for women who never compromise on quality.</p>
        <SaleCountdown />
        <div className="hero-actions">
          <Link to="/shop" className="button button-primary">Shop the sale <ArrowRight /></Link>
          <Link to="/quality" className="text-link">Why Tovia’s <span>↗</span></Link>
        </div>
        <div className="hero-trust">
          <div className="avatar-stack"><span>TO</span><span>VI</span><span>A’S</span></div>
          <div><div className="stars">★★★★★</div><small>Loved by our growing luxe community</small></div>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-brand-art">
          <div className="hero-logo"><BrandMark /></div>
          <span>Our first-ever</span>
          <strong>10 Days<br /><em>Mega Sale</em></strong>
          <small>November 24 — December 3</small>
        </div>
        <div className="sale-orbit"><strong>10%</strong><span>OFF<br />ALL HAIRS</span></div>
        <div className="hero-note"><Gift /><span><b>A gift with every order</b><small>Because every crown deserves an extra touch.</small></span></div>
      </div>
    </main>
  );
}

const benefits = [
  [ShieldCheck, "Premium quality", "Raw & virgin human hair"],
  [Gift, "Free gifts", "Included with every order"],
  [Truck, "Free delivery", "On orders above ₦400,000"],
  [PackageCheck, "Secure ordering", "Direct checkout on our site"],
];

function Benefits() {
  return <section className="benefit-strip">{benefits.map(([Icon, title, text]) => <div key={title}><Icon /><span><b>{title}</b><small>{text}</small></span></div>)}</section>;
}

function SaleFeature() {
  return (
    <section className="sale-feature section" id="sale">
      <div className="section-heading split-heading">
        <div><span className="kicker">The moment is here</span><h2>Ten days of <em>luxe.</em></h2></div>
        <p>Our first-ever sale is an invitation to own the hair you’ve been saving. Every piece is 10% off, with a complimentary gift included.</p>
      </div>
      <div className="sale-grid">
        <article className="sale-card dark-card"><span>01</span><div><small>Sale window</small><h3>Nov 24<br />— Dec 03</h3><p>Ten days only. Installment payments must be completed before the sale ends.</p></div></article>
        <article className="sale-image-card brand-pattern"><div><small>The Tovia’s collection</small><strong>Made to turn heads.</strong></div></article>
        <article className="sale-card pink-card"><span>02</span><div><small>Your offer</small><h3>10% off<br />all hairs</h3><p>Plus free delivery when your order total is above ₦400,000.</p></div></article>
      </div>
    </section>
  );
}

function ProductCard({ product, onSelect, saved = false, onToggleWishlist }) {
  return (
    <article className="product-card">
      <button className="product-image" onClick={() => onSelect(product)}>
        {CATALOG_PENDING ? <span className="product-placeholder"><Sparkles /><b>{product.category}</b><small>Product image coming soon</small></span> : <img src={product.image} alt={product.name} loading="lazy" />}
        <span className="product-badge">{CATALOG_PENDING ? "CATALOGUE PREVIEW" : product.badge}</span>
        <span className="quick-add">View details <ArrowRight /></span>
      </button>
      <div className="product-info">
        <small>{product.category}</small>
        <h3>{product.name}</h3>
        <div><span>{CATALOG_PENDING ? "Price coming soon" : `From ${formatMoney(Math.min(...product.variants.map((item) => item.salePrice)))}`}</span><button className={saved ? "saved" : ""} onClick={() => onToggleWishlist(product.id)} aria-label={saved ? "Remove from wishlist" : "Save product"}><Heart fill={saved ? "currentColor" : "none"} /></button></div>
      </div>
    </article>
  );
}

function Shop({ onSelect, featured = false, wishlist = [], onToggleWishlist }) {
  const [category, setCategory] = useState("All Hairs");
  const [query, setQuery] = useState("");
  const filtered = PRODUCTS.filter((product) => (category === "All Hairs" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase()));
  const shownProducts = featured ? filtered.slice(0, 4) : filtered;

  return (
    <section className="shop-section section" id="shop">
      <div className="section-heading shop-heading">
        <div><span className="kicker">The sale edit</span><h2>Find your <em>perfect texture.</em></h2></div>
        <label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search our collection" /></label>
      </div>
      <div className="category-scroll">{CATEGORIES.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="product-grid">{shownProducts.map((product) => <ProductCard key={product.id} product={product} onSelect={onSelect} saved={wishlist.includes(product.id)} onToggleWishlist={onToggleWishlist} />)}</div>
      {!filtered.length && <div className="empty-state">No hair matched that search. Try another style.</div>}
      {featured && <div className="view-all"><Link className="button button-primary" to="/shop">View all hairs <ArrowRight /></Link></div>}
    </section>
  );
}

function Quality() {
  return (
    <section className="quality-section" id="quality">
      <div className="quality-photo quality-art"><div><Sparkles /><span>TOVIA’S</span><small>THE LUXE STANDARD</small></div><span>100%<small>human hair</small></span></div>
      <div className="quality-copy">
        <span className="kicker">Not just hair. A standard.</span>
        <h2>Luxury you can <em>feel.</em><br />Quality you can trust.</h2>
        <p>We select every unit for softness, fullness, and longevity—then finish it with care so it arrives ready to become your signature.</p>
        <ul>
          <li><Check /><span><b>Full from root to tip</b><small>No thin ends. No disappointing density.</small></span></li>
          <li><Check /><span><b>Minimal shedding & tangling</b><small>Hair that stays beautiful through every wear.</small></span></li>
          <li><Check /><span><b>Versatile, lasting quality</b><small>Style, colour, and wear it your way with proper care.</small></span></li>
        </ul>
        <Link className="text-link light" to="/shop">Explore the collection <ArrowRight /></Link>
      </div>
    </section>
  );
}

function HairGuide() {
  const steps = [["01", "Choose your texture", "Straight, wavy, or curly—begin with the look that feels most like you."], ["02", "Select your length", "Use each product’s options to choose the exact length and price you prefer."], ["03", "Checkout securely", "Enter your delivery details, receive an order number, then complete payment."], ["04", "Your crown arrives", "Sale deliveries begin December 7 and run through December 15."]];
  return (
    <section className="guide-section section" id="guide">
      <div className="section-heading centered"><span className="kicker">Simple from start to slay</span><h2>Your luxe hair, <em>four steps away.</em></h2></div>
      <div className="guide-grid">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
  );
}

function ChoiceGuide() {
  return <section className="choice-guide section"><div className="section-heading split-heading"><div><span className="kicker">Choose with confidence</span><h2>Know your <em>hair details.</em></h2></div><p>The right choice depends on how you like to style, part, install, and maintain your hair. Product-specific information will always appear on each listing.</p></div><div className="choice-grid"><article><span>01</span><h3>Closure wigs</h3><p>A closure covers a focused section at the front of the unit. It is often easier to maintain and can be a practical choice for everyday wear.</p><small>Common sizes: 4×4 and 5×5</small></article><article><span>02</span><h3>Frontal wigs</h3><p>A frontal extends across more of the hairline and offers broader parting and styling freedom. Installation may require more care.</p><small>Common sizes: 13×4 and 13×6</small></article><article><span>03</span><h3>Texture matters</h3><p>Straight, body wave, deep wave, and curly hair can look different at the same measured length because curl patterns create shrinkage.</p><small>Compare by stretched length</small></article><article><span>04</span><h3>Density & fullness</h3><p>Density describes how full a finished unit appears. Your ideal density depends on the style, length, texture, and look you prefer.</p><small>Check each product specification</small></article></div><div className="length-note"><Sparkles /><div><h3>A note about length</h3><p>Hair is generally measured from root to tip while stretched straight. Curly and wavy textures will appear shorter in their natural state.</p></div><Link to="/contact">Ask for help <ArrowRight /></Link></div></section>;
}

function ReviewSection() {
  return (
    <section className="review-section">
      <div className="review-quote">
        <span className="kicker">The luxe community</span>
        <blockquote>Real women.<br />Real crowns.<br /><em>Real confidence.</em></blockquote>
        <p>Verified customer stories will be shared here as the collection launches.</p>
        <Link className="button button-primary review-button" to="/reviews">Visit customer reviews <ArrowRight /></Link>
      </div>
      <div className="review-image review-art"><div><Camera /><strong>Follow the luxe life.</strong><small>Real customer looks coming soon.</small></div><span><Camera /> @Toviasluxehairs</span></div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  const faqs = [
    ["When will sale orders be delivered?", "Delivery for sale orders begins December 7 and runs through December 15. If you need your hair earlier, please order at the regular price."],
    ["Can I pay in installments?", "Yes. Any installment started during the sale must be completed before the sale ends on December 3."],
    ["How do I qualify for free delivery?", "Free delivery applies automatically when your cart subtotal reaches ₦400,000 or more."],
    ["Does every order receive a gift?", "Yes. Every sale order comes with a free gift, with a customized amazing gift reserved for qualifying VIP orders."],
  ];
  return (
    <section className="faq-section section">
      <div><span className="kicker">Good to know</span><h2>Questions,<br /><em>answered.</em></h2><p>Need more help? Call us on <a href={`tel:${STORE_CONFIG.displayPhone}`}>{STORE_CONFIG.displayPhone}</a>.</p></div>
      <div className="faq-list">{faqs.map(([question, answer], index) => <article className={open === index ? "open" : ""} key={question}><button onClick={() => setOpen(open === index ? -1 : index)}><span>{question}</span><ChevronDown /></button><p>{answer}</p></article>)}</div>
    </section>
  );
}

function ProductModal({ product, onClose, onAdd }) {
  const [variantIndex, setVariantIndex] = useState(0);
  useEffect(() => setVariantIndex(0), [product]);
  if (!product) return null;
  const variant = product.variants[variantIndex];
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="product-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Close product details" onClick={onClose}><X /></button>
        <div className="modal-image"><img src={product.image} alt={product.name} /><span>{product.badge}</span></div>
        <div className="modal-copy">
          <small className="kicker">{product.category}</small><h2>{product.name}</h2>
          <div className="price-line"><strong>{formatMoney(variant.salePrice)}</strong><del>{formatMoney(variant.normalPrice)}</del><span>Save {formatMoney(variant.normalPrice - variant.salePrice)}</span></div>
          <p>{product.description}</p>
          <div className="specs"><span><small>Lace</small>{product.laceType}</span><span><small>Density</small>{product.density}</span></div>
          <label className="variant-label">Choose length</label>
          <div className="variant-grid">{product.variants.map((item, index) => <button className={variantIndex === index ? "active" : ""} key={item.length} onClick={() => setVariantIndex(index)}><span>{item.length}</span><small>{formatMoney(item.salePrice)}</small></button>)}</div>
          <button className="button button-primary full-button" onClick={() => { onAdd(product, variant); onClose(); }}>Add to bag <ShoppingBag /></button>
          <div className="mini-trust"><ShieldCheck /> Secure checkout <span>•</span> <Gift /> Free gift included</div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ open, onClose, cart, setCart, onCheckout }) {
  const subtotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const update = (key, amount) => setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item).filter((item) => item.quantity > 0));
  return (
    <div className={`drawer-wrap ${open ? "open" : ""}`} aria-hidden={!open}>
      <button className="drawer-shade" onClick={onClose} aria-label="Close cart" />
      <aside className="cart-drawer">
        <div className="drawer-head"><div><small>Your selection</small><h2>Shopping bag <span>({cart.reduce((sum, item) => sum + item.quantity, 0)})</span></h2></div><button className="icon-button" aria-label="Close shopping bag" onClick={onClose}><X /></button></div>
        {cart.length ? <>
          <div className="free-delivery-progress"><div><span>{subtotal >= STORE_CONFIG.freeDeliveryThreshold ? "You’ve unlocked free delivery" : `${formatMoney(STORE_CONFIG.freeDeliveryThreshold - subtotal)} away from free delivery`}</span><Truck /></div><i><b style={{ width: `${Math.min(100, subtotal / STORE_CONFIG.freeDeliveryThreshold * 100)}%` }} /></i></div>
          <div className="cart-items">{cart.map((item) => <article key={item.key}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><small>{item.length}</small><strong>{formatMoney(item.salePrice)}</strong><div className="quantity"><button onClick={() => update(item.key, -1)}><Minus /></button><span>{item.quantity}</span><button onClick={() => update(item.key, 1)}><Plus /></button></div></div></article>)}</div>
          <div className="cart-footer"><div className="cart-gift"><Gift /><span><b>Your free gift is included</b><small>A little thank-you from Tovia’s.</small></span></div><div className="subtotal"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><small>Delivery is calculated at checkout.</small><button className="button button-primary full-button" onClick={onCheckout}>Proceed to checkout <ArrowRight /></button></div>
        </> : <div className="empty-cart"><ShoppingBag /><h3>Your bag is waiting</h3><p>Find a texture you love and it will appear right here.</p><button className="button button-primary" onClick={onClose}>Explore the sale</button></div>}
      </aside>
    </div>
  );
}

function Checkout({ cart, onClose, onComplete }) {
  const [form, setForm] = useState({ customer_name: "", email: "", phone: "", address: "", city: "", state: "", notes: "" });
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const subtotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const deliveryFee = deliveryFeeFor(subtotal);
  const total = subtotal + deliveryFee;
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setStatus("loading");
    const order_number = `TVL-${Date.now().toString().slice(-7)}`;
    try {
      const order = await createOrder({ ...form, order_number, items: cart.map(({ key, ...item }) => item), subtotal, delivery_fee: deliveryFee, total, payment_method: "bank_transfer", payment_status: "pending", order_status: "new" });
      setResult(order); setStatus("success"); onComplete();
    } catch (error) { setResult({ error: error.message }); setStatus("error"); }
  };

  return (
    <div className="checkout-screen">
      <header><Logo /><button className="icon-button" aria-label="Close checkout" onClick={onClose}><X /></button></header>
      {status === "success" ? <div className="order-success"><span><Check /></span><small>Order received</small><h1>Thank you, {form.customer_name.split(" ")[0]}.</h1><p>Your order number is <b>{result.order_number}</b>. Complete your bank transfer with the details below so we can confirm your order.</p><div className="bank-card"><small>Transfer {formatMoney(total)} to</small><h3>{STORE_CONFIG.bankDetails.bankName}</h3><strong>{STORE_CONFIG.bankDetails.accountNumber}</strong><p>{STORE_CONFIG.bankDetails.accountName}</p></div><p className="success-note">After payment, send your receipt to {STORE_CONFIG.displayPhone} for confirmation.</p>{!isSupabaseConfigured && <p className="demo-warning">Demo mode: connect Supabase with the included setup file before going live.</p>}<button className="button button-primary" onClick={onClose}>Continue shopping</button></div> :
      <div className="checkout-layout">
        <form onSubmit={submit} className="checkout-form"><span className="kicker">Secure checkout</span><h1>Where should we<br /><em>send your crown?</em></h1>
          <div className="field-grid"><label className="wide">Full name<input required name="customer_name" value={form.customer_name} onChange={change} placeholder="Your full name" /></label><label>Email address<input required type="email" name="email" value={form.email} onChange={change} placeholder="you@email.com" /></label><label>Phone number<input required type="tel" name="phone" value={form.phone} onChange={change} placeholder="0800 000 0000" /></label><label className="wide">Delivery address<input required name="address" value={form.address} onChange={change} placeholder="Street address and house number" /></label><label>City<input required name="city" value={form.city} onChange={change} placeholder="City" /></label><label>State<input required name="state" value={form.state} onChange={change} placeholder="State" /></label><label className="wide">Order note <small>(optional)</small><textarea name="notes" value={form.notes} onChange={change} placeholder="Anything we should know?" /></label></div>
          {status === "error" && <p className="form-error">{result.error}</p>}
          <button disabled={status === "loading"} className="button button-primary full-button">{status === "loading" ? "Placing your order…" : `Place order · ${formatMoney(total)}`} <ArrowRight /></button><p className="checkout-disclaimer"><ShieldCheck /> Your information is encrypted and used only to fulfil your order.</p>
        </form>
        <aside className="order-summary"><small>Your order</small><h2>{cart.reduce((sum, item) => sum + item.quantity, 0)} beautiful piece{cart.length === 1 ? "" : "s"}</h2>{cart.map((item) => <article key={item.key}><div><img src={item.image} alt="" /><b>{item.quantity}</b></div><span><strong>{item.name}</strong><small>{item.length}</small></span><b>{formatMoney(item.salePrice * item.quantity)}</b></article>)}<div className="summary-totals"><p><span>Subtotal</span><b>{formatMoney(subtotal)}</b></p><p><span>Delivery</span><b>{deliveryFee ? formatMoney(deliveryFee) : "Free"}</b></p><p><span>Total</span><strong>{formatMoney(total)}</strong></p></div><div className="summary-note"><Gift /><span><b>Free gift included</b><small>Every sale order gets something special.</small></span></div></aside>
      </div>}
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageBanner({ kicker, title, description }) {
  return (
    <section className="page-banner">
      <span className="kicker">{kicker}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function ProductPage({ onAdd }) {
  const { productId } = useParams();
  const product = PRODUCTS.find((item) => item.id === productId);
  const [variantIndex, setVariantIndex] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  if (!product) return <Navigate to="/shop" replace />;
  const variant = product.variants[variantIndex];
  return (
    <main className="product-page">
      <div className="breadcrumbs"><Link to="/shop">Shop</Link><span>/</span><span>{product.category}</span></div>
      <div className="product-page-grid">
        <div className={`product-gallery ${CATALOG_PENDING ? "pending" : ""}`}>
          {!CATALOG_PENDING && <div className="gallery-thumbs">{product.images.map((image, index) => <button aria-label={`View product image ${index + 1}`} className={activeImage === index ? "active" : ""} key={image} onClick={() => setActiveImage(index)}><img src={image} alt="" /></button>)}</div>}
          <div className={`gallery-main ${CATALOG_PENDING ? "gallery-placeholder" : ""}`}>{CATALOG_PENDING ? <div><Sparkles /><b>{product.category}</b><span>Official product image coming soon</span></div> : <img src={product.images[activeImage] || product.image} />}<span>{CATALOG_PENDING ? "CATALOGUE PREVIEW" : product.badge}</span></div>
        </div>
        <div className="product-details">
          <span className="kicker">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="price-line">{CATALOG_PENDING ? <strong>Price coming soon</strong> : <><strong>{formatMoney(variant.salePrice)}</strong><del>{formatMoney(variant.normalPrice)}</del><span>10% off</span></>}</div>
          <div className="rating-line"><span>★★★★★</span> Sale favourite</div>
          <p>{product.description}</p>
          <div className="specs"><span><small>Lace</small>{product.laceType}</span><span><small>Density</small>{product.density}</span></div>
          <label className="variant-label">Choose your length</label>
          <div className="variant-grid">{product.variants.map((item, index) => <button className={variantIndex === index ? "active" : ""} key={item.length} onClick={() => setVariantIndex(index)}><span>{item.length}</span><small>{CATALOG_PENDING ? "Price pending" : formatMoney(item.salePrice)}</small></button>)}</div>
          <button disabled={CATALOG_PENDING} className="button button-primary full-button product-add" onClick={() => onAdd(product, variant)}>{CATALOG_PENDING ? "Available when catalogue is confirmed" : `Add to bag · ${formatMoney(variant.salePrice)}`} <ShoppingBag /></button>
          <div className="product-promises"><p><Gift /><span><b>Free gift included</b><small>With every sale order</small></span></p><p><Truck /><span><b>Free delivery over ₦400,000</b><small>Applied automatically</small></span></p><p><ShieldCheck /><span><b>Secure order processing</b><small>Powered by Supabase</small></span></p></div>
        </div>
      </div>
    </main>
  );
}

function HomePage({ openProduct, wishlist, onToggleWishlist }) {
  return <><Hero /><Benefits /><Shop onSelect={openProduct} featured wishlist={wishlist} onToggleWishlist={onToggleWishlist} /><ReviewSection /></>;
}

function ShopPage({ openProduct, wishlist, onToggleWishlist }) {
  return <><PageBanner kicker="The complete collection" title="Shop your next crown." description="Explore premium straight, wavy, curly, bob, and coloured human hair in the length made for you." /><Shop onSelect={openProduct} wishlist={wishlist} onToggleWishlist={onToggleWishlist} /></>;
}

function SalePage({ openProduct, wishlist, onToggleWishlist }) {
  return <><PageBanner kicker="November 24 — December 3" title="The ten-day mega sale." description="Enjoy 10% off every hair, a free gift with every order, and free delivery above ₦400,000." /><SaleFeature /><Shop onSelect={openProduct} wishlist={wishlist} onToggleWishlist={onToggleWishlist} /></>;
}

function QualityPage() {
  return <><PageBanner kicker="The Tovia’s standard" title="Beautiful hair. No compromise." description="Learn what makes our raw and virgin human hair worthy of your crown." /><Quality /><ReviewSection /></>;
}

function GuidePage() {
  return <><PageBanner kicker="From selection to delivery" title="Ordering made beautifully simple." description="Everything you need to know before choosing and ordering your next Tovia’s look." /><HairGuide /><ChoiceGuide /><FAQ /></>;
}

function AboutPage() {
  return <>
    <PageBanner kicker="Meet the brand" title="Luxury made personal." description="Tovia’s Luxe Hairs exists to make premium hair feel considered, confident, and beautifully yours." />
    <section className="story-section section">
      <div className="story-art"><BrandMark /><span>Luxury in<br /><em>Every Strands</em></span></div>
      <div className="story-copy"><span className="kicker">Our point of view</span><h2>Your hair should feel as good as it looks.</h2><p>We believe buying luxury hair should be clear, enjoyable, and trustworthy. That means carefully presented collections, helpful product information, direct ordering, and customer care that stays accessible throughout your experience.</p><p>As the official catalogue is prepared, every product image, specification, and price will be published only after it has been confirmed by the brand.</p><Link className="text-link" to="/quality">Discover our quality promise <ArrowRight /></Link></div>
    </section>
    <section className="values-section section"><div className="section-heading centered"><span className="kicker">What guides us</span><h2>The Tovia’s <em>standard.</em></h2></div><div className="values-grid"><article><ShieldCheck /><h3>Trust first</h3><p>Clear information and a secure direct ordering experience.</p></article><article><Sparkles /><h3>Luxury, always</h3><p>A refined experience from product discovery to delivery.</p></article><article><Heart /><h3>Customer care</h3><p>Thoughtful support before, during, and after every order.</p></article></div></section>
  </>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const messages = JSON.parse(localStorage.getItem("tovia-demo-messages") || "[]");
    localStorage.setItem("tovia-demo-messages", JSON.stringify([{ ...data, id: `MSG-${Date.now()}`, status: "unread", created_at: new Date().toISOString() }, ...messages]));
    setSent(true); event.currentTarget.reset();
  };
  return <>
    <PageBanner kicker="We’re here to help" title="Let’s talk about your crown." description="Questions about textures, ordering, delivery, or the upcoming sale? Reach the Tovia’s team through the channel that works for you." />
    <section className="contact-section section">
      <div className="contact-details"><span className="kicker">Contact Tovia’s</span><h2>Personal help,<br /><em>when you need it.</em></h2><p>For the fastest response, call or message during business hours. Please include your order number when asking about an existing order.</p><div className="contact-cards"><a href={`tel:${STORE_CONFIG.displayPhone}`}><span><PackageCheck /></span><div><small>Call or message</small><b>{STORE_CONFIG.displayPhone}</b></div><ArrowRight /></a><a href={STORE_CONFIG.instagramUrl} target="_blank" rel="noreferrer"><span><Camera /></span><div><small>Instagram</small><b>{STORE_CONFIG.instagramHandle}</b></div><ArrowRight /></a><a href={STORE_CONFIG.tiktokUrl} target="_blank" rel="noreferrer"><span><Sparkles /></span><div><small>TikTok</small><b>{STORE_CONFIG.tiktokHandle}</b></div><ArrowRight /></a></div></div>
      <form className="contact-form" onSubmit={submit}><small>Send an enquiry</small><h3>How can we help?</h3><div className="field-grid"><label>Full name<input required name="name" placeholder="Your full name" /></label><label>Phone number<input required name="phone" type="tel" placeholder="0800 000 0000" /></label><label className="wide">Topic<select name="topic" defaultValue=""><option value="" disabled>Choose a topic</option><option>Product question</option><option>Order support</option><option>Delivery</option><option>Sale enquiry</option><option>Other</option></select></label><label className="wide">Message<textarea required name="message" placeholder="Tell us how we can help" /></label></div>{sent && <p className="form-success"><Check /> Thank you. Your enquiry is now in the admin preview inbox.</p>}<button className="button button-primary full-button">Send enquiry <ArrowRight /></button><p className="form-note">Live message delivery will replace local preview storage during backend setup.</p></form>
    </section>
  </>;
}

function ReviewsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [verifiedReviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tovia-demo-reviews") || "[]").filter((review) => review.status === "approved"); }
    catch { return []; }
  });
  return <>
    <PageBanner kicker="Customer stories" title="The confidence is mutual." description="A dedicated home for verified Tovia’s Luxe Hairs reviews, customer looks, and honest product experiences." />
    <section className="reviews-page section">{verifiedReviews.length ? <div className="verified-review-grid">{verifiedReviews.map((review) => <article key={review.id}><div>{"★".repeat(Number(review.rating))}{"☆".repeat(5-Number(review.rating))}</div><blockquote>“{review.review}”</blockquote><p><b>{review.customer_name}</b><small>Verified order · {review.order_number}</small></p></article>)}</div> : <div className="reviews-empty"><div className="stars">★★★★★</div><Sparkles /><h2>Our verified reviews are coming soon.</h2><p>We won’t publish made-up testimonials. As genuine customer orders are completed, their approved experiences will appear here.</p><Link className="button button-primary" to="/shop">Explore the collection <ArrowRight /></Link></div>}<form className="review-form" onSubmit={(event) => { event.preventDefault(); if (!rating) return; const data = Object.fromEntries(new FormData(event.currentTarget)); const reviews = JSON.parse(localStorage.getItem("tovia-demo-reviews") || "[]"); localStorage.setItem("tovia-demo-reviews", JSON.stringify([{ ...data, id: `REV-${Date.now()}`, rating, status: "pending", created_at: new Date().toISOString() }, ...reviews])); setSubmitted(true); event.currentTarget.reset(); setRating(0); }}><span className="kicker">Already a customer?</span><h3>Share your Tovia’s experience.</h3><p>Your review will be checked against an order before it is published.</p><div className="rating-picker" aria-label="Choose a rating">{[1,2,3,4,5].map((value) => <button className={value <= rating ? "active" : ""} onClick={() => setRating(value)} type="button" key={value} aria-label={`${value} star${value === 1 ? "" : "s"}`}>{value <= rating ? "★" : "☆"}</button>)}</div>{!rating && <small className="rating-help">Choose a star rating</small>}<label>Order number<input required name="order_number" placeholder="e.g. TVL-1234567" /></label><label>Your name<input required name="customer_name" placeholder="Name shown with your review" /></label><label>Your review<textarea required name="review" placeholder="Tell us about your hair and experience" /></label>{submitted && <p className="form-success"><Check /> Thank you. Your review is ready for verification.</p>}<button className="button button-primary full-button">Submit for verification <ArrowRight /></button></form></section>
  </>;
}

function DeliveryPage() {
  return <><PageBanner kicker="Delivery & returns" title="From our hands to yours." description="A clear guide to sale delivery dates, delivery eligibility, receiving your package, and requesting help with an order." /><section className="policy-content section"><aside><span className="kicker">On this page</span><a href="#timing">Delivery timing</a><a href="#fees">Delivery fees</a><a href="#receiving">Receiving an order</a><a href="#returns">Returns & exchanges</a><a href="#issues">Order concerns</a></aside><div><article id="timing"><span>01</span><h2>Delivery timing</h2><p>Orders placed during the mega sale are scheduled for delivery from <b>{STORE_CONFIG.deliveryDates}</b>. If you need an item urgently, contact the team before ordering to confirm what is possible.</p></article><article id="fees"><span>02</span><h2>Delivery fees</h2><p>Delivery is free when your product subtotal is at least <b>{formatMoney(STORE_CONFIG.freeDeliveryThreshold)}</b>. For smaller orders, the applicable delivery amount is displayed during checkout before an order is placed.</p></article><article id="receiving"><span>03</span><h2>Receiving your order</h2><p>Use an active phone number and complete address at checkout. Keep your phone available during the delivery window so the courier can reach you.</p></article><article id="returns"><span>04</span><h2>Returns & exchanges</h2><p>Contact Tovia’s before sending any item back. Eligibility depends on the item’s condition, whether it has been worn, altered, cut, coloured, washed, or had its lace modified, and the reason for the request. The final approved policy will be displayed at checkout before live sales begin.</p></article><article id="issues"><span>05</span><h2>Order concerns</h2><p>If your package arrives with an issue, keep the packaging and contact Tovia’s immediately with your order number, clear photos, and a description of the concern. The team will review the case and explain the available resolution.</p></article></div></section></>;
}

function HairCarePage() {
  const tips = [["01", "Detangle gently", "Work from the ends upward with a wide-tooth comb or suitable brush. Hold the hair above the section you are detangling to reduce tension."], ["02", "Clean with care", "Use lukewarm water and gentle, hair-appropriate products. Avoid rough rubbing, twisting, or bunching the hair while washing."], ["03", "Condition & hydrate", "Apply conditioner through the lengths, avoiding heavy product build-up around lace and knots. Rinse thoroughly."], ["04", "Dry properly", "Air-dry whenever possible on a wig stand. If heat is necessary, use a heat protectant and keep the temperature appropriate for the unit."], ["05", "Store thoughtfully", "Keep clean, dry hair on a stand or inside a satin bag away from direct sunlight, dust, and friction."], ["06", "Protect at night", "Use a satin bonnet or pillowcase and secure longer hair in a loose braid or wrap before sleeping."]];
  return <><PageBanner kicker="Protect your investment" title="Care that keeps the luxury." description="Simple habits that help human hair stay soft, manageable, and beautiful between wears." /><section className="care-section section"><div className="care-intro"><span className="kicker">The essentials</span><h2>Good hair deserves<br /><em>good maintenance.</em></h2><p>Always follow the product-specific guidance supplied with your unit. When in doubt, contact Tovia’s before using colour, bleach, strong chemicals, or high heat.</p></div><div className="care-grid">{tips.map(([number,title,text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section><section className="care-cta"><Sparkles /><h2>Unsure about a product?</h2><p>Ask before you apply. The team can help you protect your hair.</p><Link className="button button-primary" to="/contact">Ask Tovia’s <ArrowRight /></Link></section></>;
}

function FAQPage() {
  return <><PageBanner kicker="Answers before you order" title="Everything you need to know." description="Quick answers about the mega sale, installment completion, gifts, delivery, and ordering directly through the website." /><FAQ /><section className="page-cta"><h2>Still have a question?</h2><p>Speak directly with the Tovia’s team for help choosing or ordering.</p><Link className="button button-primary" to="/contact">Contact us <ArrowRight /></Link></section></>;
}

function LegalPage({ type }) {
  const privacy = type === "privacy";
  return <><PageBanner kicker="Tovia’s Luxe Hairs" title={privacy ? "Privacy policy." : "Website terms."} description={privacy ? "How customer information is handled when you browse, enquire, and place an order." : "The terms that support a clear and fair online shopping experience."} /><section className="legal-content section"><p className="legal-date">Last updated: November 12, 2026</p>{privacy ? <><h2>Information we collect</h2><p>When you place an order or submit a form, we may collect your name, phone number, email address, delivery address, order details, and the message you provide.</p><h2>How information is used</h2><p>Information is used to process orders, arrange delivery, provide customer support, prevent misuse, and improve the shopping experience. Customer order details are not intended for public display.</p><h2>Storage and service providers</h2><p>The storefront may use browser storage to remember a shopping bag. When backend services are activated, order information may be securely stored with Supabase and processed by relevant delivery or payment providers.</p><h2>Your choices</h2><p>You may contact Tovia’s to ask about your personal information or request a correction. Some order records may need to be retained for transaction and support purposes.</p></> : <><h2>Store information</h2><p>Product availability, confirmed specifications, prices, sale dates, gifts, and delivery terms shown at checkout form part of the order information. Unconfirmed catalogue content is clearly labelled as pending.</p><h2>Orders and payment</h2><p>An order is treated as pending until payment is completed and confirmed. Any installment started during the sale must be completed before the sale ends.</p><h2>Product care</h2><p>Human hair requires appropriate maintenance. Results and longevity depend on wear, handling, products, styling, and care. Follow the guidance supplied with the item and ask before applying strong chemicals or excessive heat.</p><h2>Website use</h2><p>You may use this website to browse and place genuine orders. Content, branding, and designs may not be copied or misrepresented as another business.</p></>}<h2>Contact</h2><p>Questions about these terms can be directed to <a href={`tel:${STORE_CONFIG.displayPhone}`}>{STORE_CONFIG.displayPhone}</a>.</p></section></>;
}

function WishlistPage({ wishlist, openProduct, onToggleWishlist }) {
  const products = PRODUCTS.filter((product) => wishlist.includes(product.id));
  return <><PageBanner kicker="Saved for later" title="Your luxe wishlist." description="Keep every texture that caught your eye in one place while you decide on the perfect crown." /><section className="wishlist-page section">{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onSelect={openProduct} saved onToggleWishlist={onToggleWishlist} />)}</div> : <div className="wishlist-empty"><Heart /><h2>Nothing saved yet.</h2><p>Tap the heart on any product to keep it here for later.</p><Link className="button button-primary" to="/shop">Explore the collection <ArrowRight /></Link></div>}</section></>;
}

function TrackOrderPage() {
  const [checked, setChecked] = useState(false);
  return <><PageBanner kicker="Order support" title="Track your Tovia’s order." description="Enter the order number and phone number used at checkout to view the latest order status." /><section className="track-section section"><form onSubmit={(event) => { event.preventDefault(); setChecked(true); }}><span className="kicker">Find an order</span><h2>Where is my crown?</h2><label>Order number<input required placeholder="e.g. TVL-1234567" /></label><label>Phone number<input required type="tel" placeholder="Phone used at checkout" /></label><button className="button button-primary full-button">Check order status <ArrowRight /></button>{checked && <div className="track-result"><PackageCheck /><div><b>Tracking will activate with the backend.</b><p>Your details are valid for the frontend preview. Live fulfilment updates will appear here once order services are connected.</p></div></div>}</form><aside><small>Need direct help?</small><h3>Keep your order number close.</h3><p>The Tovia’s team can use it to find your order more quickly.</p><a href={`tel:${STORE_CONFIG.displayPhone}`} className="text-link">Call {STORE_CONFIG.displayPhone} <ArrowRight /></a></aside></section></>;
}

function NotFoundPage() {
  return <main className="not-found"><span>404</span><h1>This page left<br /><em>without its crown.</em></h1><p>The link may have changed, or the page may no longer exist.</p><Link className="button button-primary" to="/">Return home <ArrowRight /></Link></main>;
}

function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer><div className="footer-top"><div><Logo /><p>Luxury human hair for women who make every entrance count.</p><a href={STORE_CONFIG.instagramUrl} target="_blank" rel="noreferrer"><Camera /> Follow us on Instagram</a></div><div><small>Shop</small><Link to="/shop">All hairs</Link><Link to="/sale">Mega sale</Link><Link to="/wishlist">Wishlist</Link><Link to="/reviews">Reviews</Link><Link to="/quality">Our quality</Link></div><div><small>Help</small><Link to="/track-order">Track order</Link><Link to="/hair-guide">Order guide</Link><Link to="/hair-care">Hair care</Link><Link to="/delivery">Delivery & returns</Link><Link to="/faq">FAQs</Link><Link to="/contact">Contact us</Link></div><div><small>Company</small><Link to="/about">About Tovia’s</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href={`tel:${STORE_CONFIG.displayPhone}`}>{STORE_CONFIG.displayPhone}</a></div><div className="newsletter"><small>The luxe list</small><h3>Good hair news, first.</h3>{subscribed ? <p className="newsletter-success"><Check /> You’re on the luxe list.</p> : <form onSubmit={(event) => { event.preventDefault(); setSubscribed(true); }}><input required type="email" placeholder="Your email address" aria-label="Email address" /><button aria-label="Subscribe"><ArrowRight /></button></form>}</div></div><div className="footer-bottom"><span>© 2026 Tovia’s Luxe Hairs</span><span>Luxury in Every Strands ♡</span><span>Made for your soft life.</span></div></footer>
  );
}

export default function App() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("tovia-cart-v2") || "[]"));
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("tovia-wishlist") || "[]"));
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckout = location.pathname === "/checkout";
  const isAdmin = location.pathname.startsWith("/admin");
  useEffect(() => {
    const routeTitles = {
      "/": "Tovia’s Luxe Hairs | Luxury in Every Strands",
      "/shop": "Shop Luxury Hair | Tovia’s Luxe Hairs",
      "/sale": "10 Days Mega Sale | Tovia’s Luxe Hairs",
      "/quality": "Our Quality | Tovia’s Luxe Hairs",
      "/hair-guide": "Order Guide | Tovia’s Luxe Hairs",
      "/about": "About Us | Tovia’s Luxe Hairs",
      "/contact": "Contact Us | Tovia’s Luxe Hairs",
      "/reviews": "Customer Reviews | Tovia’s Luxe Hairs",
      "/delivery": "Delivery & Returns | Tovia’s Luxe Hairs",
      "/hair-care": "Hair Care Guide | Tovia’s Luxe Hairs",
      "/faq": "Frequently Asked Questions | Tovia’s Luxe Hairs",
      "/wishlist": "Your Wishlist | Tovia’s Luxe Hairs",
      "/track-order": "Track Your Order | Tovia’s Luxe Hairs",
      "/privacy": "Privacy Policy | Tovia’s Luxe Hairs",
      "/terms": "Website Terms | Tovia’s Luxe Hairs",
      "/checkout": "Secure Checkout | Tovia’s Luxe Hairs",
      "/admin": "Store Admin | Tovia’s Luxe Hairs",
    };
    document.title = location.pathname.startsWith("/product/") ? "Product Details | Tovia’s Luxe Hairs" : routeTitles[location.pathname] || "Page Not Found | Tovia’s Luxe Hairs";
  }, [location.pathname]);
  useEffect(() => localStorage.setItem("tovia-cart-v2", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("tovia-wishlist", JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => { document.body.style.overflow = cartOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [cartOpen]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const addToCart = (product, variant) => {
    const key = `${product.id}-${variant.length}`;
    setCart((current) => current.some((item) => item.key === key) ? current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { key, id: product.id, name: product.name, image: product.image, length: variant.length, normalPrice: variant.normalPrice, salePrice: variant.salePrice, quantity: 1 }]);
    setCartOpen(true);
  };
  const toggleWishlist = (productId) => setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  const openProduct = (product) => navigate(`/product/${product.id}`);
  return <>
    <ScrollToTop />
    {!isAdmin && <a className="skip-link" href="#main-content">Skip to main content</a>}
    {!isCheckout && !isAdmin && <Header cartCount={cartCount} wishlistCount={wishlist.length} onCartOpen={() => setCartOpen(true)} />}
    <div className="route-view" id="main-content" key={location.pathname}>
      <Routes>
        <Route path="/" element={<HomePage openProduct={openProduct} wishlist={wishlist} onToggleWishlist={toggleWishlist} />} />
        <Route path="/shop" element={<ShopPage openProduct={openProduct} wishlist={wishlist} onToggleWishlist={toggleWishlist} />} />
        <Route path="/sale" element={<SalePage openProduct={openProduct} wishlist={wishlist} onToggleWishlist={toggleWishlist} />} />
        <Route path="/quality" element={<QualityPage />} />
        <Route path="/hair-guide" element={<GuidePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/delivery" element={<DeliveryPage />} />
        <Route path="/hair-care" element={<HairCarePage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} openProduct={openProduct} onToggleWishlist={toggleWishlist} />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/admin" element={<Suspense fallback={<div className="admin-loading"><span>T</span><p>Preparing your workspace…</p></div>}><AdminDashboard /></Suspense>} />
        <Route path="/product/:productId" element={<ProductPage onAdd={addToCart} />} />
        <Route path="/checkout" element={cart.length ? <Checkout cart={cart} onClose={() => navigate("/shop")} onComplete={() => setCart([])} /> : <Navigate to="/shop" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
    {!isCheckout && !isAdmin && <Footer />}
    {!isCheckout && !isAdmin && <MobileDock cartCount={cartCount} wishlistCount={wishlist.length} onCartOpen={() => setCartOpen(true)} />}
    {!isCheckout && !isAdmin && <BackToTop />}
    {!isAdmin && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} onCheckout={() => { setCartOpen(false); navigate("/checkout"); }} />}
  </>;
}

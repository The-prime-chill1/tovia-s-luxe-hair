# Tovia’s Luxe Hairs

Responsive React storefront and admin-dashboard frontend for Tovia’s Luxe Hairs.

## Run locally

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm run preview
```

## Main routes

- `/` — Home
- `/shop` — Catalogue
- `/sale` — Mega sale
- `/quality` — Quality promise
- `/hair-guide` — Ordering, lace, texture, density, and length guide
- `/hair-care` — Care guide
- `/reviews` — Verified reviews and review submission
- `/delivery` — Delivery information
- `/track-order` — Order tracking interface
- `/about`, `/contact`, `/faq`, `/privacy`, `/terms`
- `/wishlist` — Locally saved products
- `/admin` — Frontend admin preview

## Catalogue status

Stock photography and unconfirmed prices are intentionally hidden. Product cards use branded placeholders until the owner supplies:

1. Official product names and categories
2. Product photos or videos
3. Available lengths and lace options
4. Confirmed normal and sale prices
5. Product-specific descriptions and care notes

After the catalogue data is replaced and verified, set `catalogReady` to `true` in `src/data/storeConfig.js`.

## Admin preview

The admin dashboard currently uses browser storage for frontend demonstrations. Contact-form messages and review submissions can flow into the preview dashboard on the same browser. This is not production authentication.

## Supabase setup (later)

Copy `.env.example` to `.env`, add the project URL and anonymous key, then run `supabase-schema.sql` in the Supabase SQL editor. Backend activation should happen only after the frontend and final catalogue are approved.

## Deployment

SPA fallback configurations are included for Vercel (`vercel.json`) and Netlify (`public/_redirects`).

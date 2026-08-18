# TroveMart — Product Showcase Website

A clean, fast, static catalog website for an **eBay store**. Customers browse
product details here, then click **"Buy on eBay"** to complete the purchase
securely on eBay. No backend, no payment handling — cheap and safe to host.

**Domain:** trovemart.co.uk

---

## 📁 Project structure

```
trovemart/
├── index.html              ← the page (structure only)
├── assets/
│   ├── css/style.css       ← all styling
│   ├── js/products.js      ← ⭐ EDIT THIS: store URL + product list
│   ├── js/app.js           ← rendering logic (rarely needs editing)
│   └── img/                ← put real product photos here
└── README.md
```

---

## ✏️ How to update the site

Open **`assets/js/products.js`** — everything you need is there.

**1. Set the eBay store link**
```js
storeUrl: "https://www.ebay.co.uk/str/YOUR-STORE-NAME",
```

**2. Add or edit a product** — copy a block and change the values:
```js
{
  id: "new1",
  category: "Perfumes",              // Perfumes | Home Appliances | Tools
  name: "Product name buyers search",
  price: 24.99,                      // number only, no £ sign
  emoji: "🌸",                       // shown if no photo
  image: "assets/img/my-photo.jpg",  // optional — real photo
  description: "Short 1–2 line description.",
  ebayUrl: "https://www.ebay.co.uk/itm/PASTE-REAL-LISTING-LINK",
}
```

> 💡 For real listings, set `ebayUrl` to the **exact eBay item link**
> (the URL that opens when you view the product on eBay).

**3. Add a real photo:** drop the image into `assets/img/`, then set the
product's `image` field to `"assets/img/filename.jpg"`.

---

## 👀 Preview locally

Just open `index.html` in a browser — or run a tiny local server:
```bash
cd trovemart
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## 🚀 Deploy (put it live on trovemart.co.uk)

It's a static site, so hosting is easy and often free:

- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the folder, then
  point the `trovemart.co.uk` domain at it (free tier is plenty).
- **Your own server** — copy the folder into the web root (e.g. Nginx/Apache).

Then set the domain's DNS at your registrar to your host.

---

## ✅ Why this setup is good
- No checkout on the site = no payment/security liability (eBay handles it).
- Google-friendly (SEO) so products can rank and drive free traffic.
- Full eBay Buyer Protection on every order.

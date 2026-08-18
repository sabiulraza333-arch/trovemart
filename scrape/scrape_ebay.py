#!/usr/bin/env python3
"""
Scrape an eBay store's public listings and generate TroveMart's products.js.

Usage:
  python3 scrape_ebay.py --url https://www.ebay.co.uk/str/primecartltd --out ../assets/js/products.js
  python3 scrape_ebay.py --file saved_store.html --out products.js   # parse a saved page (dev)

Notes:
  - Extracts title, price, image and the exact eBay item link for each listing.
  - Categorises each item with simple keyword heuristics (best-effort).
  - Only reads PUBLIC store pages and links straight back to eBay for checkout.
"""
import argparse, json, re, sys, urllib.request
from bs4 import BeautifulSoup

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")

# (category, [regex patterns]). First category with any match wins — so put the
# most distinctive categories first. Patterns use \b word-boundaries to avoid
# false hits like "led" inside "sealed" or "light" inside "headlight".
CATEGORY_RULES = [
    ("Fragrance & Beauty", [r"perfume", r"eau de", r"\bedp\b", r"\bedt\b", r"parfum",
                            r"cologne", r"aftershave", r"fragrance", r"toilette"]),
    ("Automotive & Bike",  [r"\bcar\b", r"motorcycle", r"scooter", r"\batv\b", r"bicycle",
                            r"\bbike\b", r"vehicle", r"brake", r"clutch", r"exhaust", r"\bfuel\b",
                            r"engine", r"carburet", r"spark", r"headlight", r"\bbulb", r"\btyre",
                            r"\btire", r"wheel", r"battery terminal", r"key case", r"key fob",
                            r"cigarette lighter", r"derailleur", r"go-kart", r"ignition"]),
    ("Tools & Hardware",   [r"screw", r"\bbolt", r"\bnut\b", r"drill", r"wrench", r"spanner",
                            r"socket", r"plier", r"fastener", r"\bclip", r"connector", r"bracket",
                            r"clamp", r"\bhex\b", r"gauge", r"test kit", r"fitting", r"\bpipe\b"]),
    ("Electronics",        [r"\busb\b", r"\bcable\b", r"charger", r"adapter", r"wireless",
                            r"bluetooth", r"\bled\b", r"sensor", r"card reader", r"oximeter",
                            r"monitor", r"\boled\b"]),
    ("Home, Garden & Outdoor", [r"kitchen", r"\bhome\b", r"\blamp", r"holder", r"storage",
                            r"garden", r"cushion", r"curtain", r"towel", r"bottle", r"\bmug\b",
                            r"organiser", r"organizer", r"beach", r"\bbag\b", r"fishing", r"\blure",
                            r"\bbbq\b", r"barbecue", r"hose", r"aquarium", r"water spray"]),
]

def categorise(title: str) -> str:
    t = title.lower()
    for cat, pats in CATEGORY_RULES:
        if any(re.search(p, t) for p in pats):
            return cat
    return "More"

def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-GB,en"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "ignore")

def parse(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    items = {}
    for a in soup.find_all("a", href=re.compile(r"/itm/\d+")):
        m = re.search(r"/itm/(\d+)", a["href"])
        if not m:
            continue
        iid = m.group(1)
        if iid in items:
            continue
        # climb to the smallest ancestor that has both an <img> and a price
        card, node = None, a
        for _ in range(7):
            node = node.parent
            if node is None:
                break
            if node.find("img") and re.search(r"[£$]\s?\d", node.get_text(" ", strip=True)):
                card = node
                break
        if card is None:
            card = a.parent
        # title
        title = (a.get("aria-label") or a.get_text(" ", strip=True) or "").strip()
        if not title:
            img = a.find("img")
            title = (img.get("alt").strip() if img and img.get("alt") else "")
        title = re.sub(r"^(New listing|Opens in a new window or tab)\s*", "", title).strip()
        # price
        pm = re.search(r"£\s?\d[\d,]*\.\d{2}", card.get_text(" ", strip=True))
        price = float(pm.group(0).replace("£", "").replace(",", "").strip()) if pm else None
        # image (handle lazy-loading attrs)
        img = card.find("img")
        image = None
        if img:
            image = img.get("src") or img.get("data-src") or img.get("data-img-src")
            if image and image.startswith("//"):
                image = "https:" + image
            if image:  # request a sharper image (eBay serves larger sizes by number)
                image = image.replace("s-l300", "s-l500").replace("s-l225", "s-l500")
        if not title or price is None:
            continue
        items[iid] = {
            "id": iid,
            "name": title[:140],
            "price": price,
            "image": image,
            "ebayUrl": f"https://www.ebay.co.uk/itm/{iid}",
            "category": categorise(title),
        }
    return items

def crawl(base_url: str, max_pages: int = 6) -> list:
    all_items = {}
    for pg in range(1, max_pages + 1):
        url = f"{base_url}{'&' if '?' in base_url else '?'}_pgn={pg}"
        try:
            html = fetch(url)
        except Exception as e:
            print(f"  page {pg}: fetch error {e}", file=sys.stderr)
            break
        found = parse(html)
        new = {k: v for k, v in found.items() if k not in all_items}
        print(f"  page {pg}: {len(found)} items ({len(new)} new)", file=sys.stderr)
        if not new:
            break
        all_items.update(new)
    return list(all_items.values())

def to_products_js(items: list, store_url: str) -> str:
    items = sorted(items, key=lambda x: (x["category"], x["name"]))
    lines = []
    lines.append("/* AUTO-GENERATED from the eBay store by scrape/scrape_ebay.py — do not hand-edit. */")
    lines.append("const SITE = {")
    lines.append('  name: "TroveMart",')
    lines.append('  tagline: "Handpicked finds, straight from our eBay store.",')
    lines.append(f'  storeUrl: "{store_url}",')
    lines.append('  currency: "£",')
    lines.append("};\n")
    lines.append("const PRODUCTS = [")
    for it in items:
        img = f'"{it["image"]}"' if it["image"] else "null"
        name = it["name"].replace("\\", "").replace('"', "'")
        lines.append("  {")
        lines.append(f'    id: "{it["id"]}", category: {json.dumps(it["category"])},')
        lines.append(f'    name: "{name}",')
        lines.append(f'    price: {it["price"]:.2f}, image: {img},')
        lines.append(f'    ebayUrl: "{it["ebayUrl"]}",')
        lines.append("  },")
    lines.append("];")
    return "\n".join(lines) + "\n"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url")
    ap.add_argument("--file")
    ap.add_argument("--store-url", default="https://www.ebay.co.uk/str/primecartltd")
    ap.add_argument("--out")
    args = ap.parse_args()

    if args.file:
        items = list(parse(open(args.file, encoding="utf-8", errors="ignore").read()).values())
    else:
        items = crawl(args.url or args.store_url)

    print(f"\nTotal items: {len(items)}", file=sys.stderr)
    from collections import Counter
    for cat, n in Counter(i["category"] for i in items).most_common():
        print(f"  {cat}: {n}", file=sys.stderr)

    js = to_products_js(items, args.store_url)
    if args.out:
        open(args.out, "w", encoding="utf-8").write(js)
        print(f"\nWrote {args.out}", file=sys.stderr)
    else:
        print(js)

if __name__ == "__main__":
    main()

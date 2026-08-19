#!/usr/bin/env bash
# TroveMart — write Stripe keys into config.php.
# YOU type the values; they are saved only in config.php on this server.
# (Claude never sees them — they are not printed back in full or sent anywhere.)
set -euo pipefail
CFG="/var/www/html/trovemart/config.php"
[ -f "$CFG" ] || { echo "❌ config.php not found at $CFG"; exit 1; }

echo "================ TroveMart payment setup ================"
echo "Paste each value when asked. They are written straight into config.php."
echo
read -rp "1) Stripe SECRET key (sk_test_... or sk_live_...): " SK
read -rp "2) Stripe WEBHOOK signing secret (whsec_...):      " WH
read -rsp "3) Admin password for /orders.php:                 " PW; echo

# sanity checks
case "$SK" in sk_test_*|sk_live_*) ;; *) echo "⚠️  Not a Stripe secret key (must start with sk_test_ or sk_live_). Aborting."; exit 1;; esac
case "$WH" in whsec_*) ;; *) echo "⚠️  Not a webhook secret (must start with whsec_). Aborting."; exit 1;; esac
[ -n "$PW" ] || { echo "⚠️  Password is empty. Aborting."; exit 1; }

cp "$CFG" "$CFG.bak.$(date +%s)"   # backup
export SK WH PW
python3 - "$CFG" <<'PY'
import os, re, sys
path = sys.argv[1]
vals = {'STRIPE_SECRET_KEY':     os.environ['SK'],
        'STRIPE_WEBHOOK_SECRET': os.environ['WH'],
        'ORDERS_ADMIN_PASSWORD': os.environ['PW']}
s = open(path, encoding='utf-8').read()
esc = lambda v: v.replace('\\', '\\\\').replace("'", "\\'")
for name, val in vals.items():
    new = "define('%s', '%s');" % (name, esc(val))
    s, n = re.subn(r"define\('" + re.escape(name) + r"',\s*'(?:\\.|[^'\\])*'\);", new, s, count=1)
    if n == 0:
        sys.stderr.write("!! could not find %s line in config.php\n" % name); sys.exit(1)
open(path, 'w', encoding='utf-8').write(s)
PY

echo
echo "✅ Saved to config.php."
echo "   Secret key ends with:  ...${SK: -4}"
echo "   Webhook secret ends:   ...${WH: -4}"
echo "Now tell Claude 'done' to verify and run a test order."

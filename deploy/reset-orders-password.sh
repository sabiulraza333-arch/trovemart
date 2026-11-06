#!/usr/bin/env bash
# TroveMart — set a new password for the orders admin page (/orders.php).
# YOU type it; it is written straight into config.php on this server.
# (Claude never sees it — nothing is printed back or sent anywhere.)
set -euo pipefail
CFG="/var/www/html/trovemart/config.php"
[ -f "$CFG" ] || { echo "❌ config.php not found at $CFG"; exit 1; }

echo "=========== TroveMart — orders page password ==========="
echo "Choose a new password for https://trovemart.co.uk/orders.php"
echo
read -rsp "New password:        " PW1; echo
read -rsp "Type it again:       " PW2; echo

[ -n "$PW1" ]        || { echo "⚠️  Password is empty. Nothing changed."; exit 1; }
[ "$PW1" = "$PW2" ]  || { echo "⚠️  The two entries do not match. Nothing changed."; exit 1; }
[ ${#PW1} -ge 8 ]    || { echo "⚠️  Use at least 8 characters. Nothing changed."; exit 1; }

cp "$CFG" "$CFG.bak.$(date +%s)"   # backup
export PW1
python3 - "$CFG" <<'PY'
import os, re, sys
path = sys.argv[1]
val  = os.environ['PW1']
esc  = val.replace('\\', '\\\\').replace("'", "\\'")
s = open(path, encoding='utf-8').read()
s, n = re.subn(r"define\('ORDERS_ADMIN_PASSWORD',\s*'(?:\\.|[^'\\])*'\);",
               "define('ORDERS_ADMIN_PASSWORD', '%s');" % esc, s, count=1)
if n == 0:
    sys.stderr.write("!! could not find the ORDERS_ADMIN_PASSWORD line in config.php\n")
    sys.exit(1)
open(path, 'w', encoding='utf-8').write(s)
PY

echo
echo "✅ Done. Log in at https://trovemart.co.uk/orders.php with the new password."

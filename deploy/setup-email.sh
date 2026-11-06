#!/usr/bin/env bash
# TroveMart — configure SMTP so order notification emails actually send.
# YOU type the password; it is written straight into config.php on this server.
# (Claude never sees it — nothing is printed back or sent anywhere.)
set -euo pipefail
CFG="/var/www/html/trovemart/config.php"
[ -f "$CFG" ] || { echo "❌ config.php not found at $CFG"; exit 1; }

echo "============ TroveMart — order email setup ============"
echo "For Gmail / Google Workspace use an APP PASSWORD (16 characters),"
echo "not your normal login password:"
echo "  Google Account -> Security -> 2-Step Verification -> App passwords"
echo

read -rp "SMTP host [smtp.gmail.com]:        " HOST; HOST="${HOST:-smtp.gmail.com}"
read -rp "SMTP port [587]:                   " PORT; PORT="${PORT:-587}"
read -rp "Your email address (SMTP user):    " USER
read -rsp "App password (hidden):             " PASS; echo
read -rp "Send order alerts TO [$USER]:      " TO;   TO="${TO:-$USER}"

[ -n "$USER" ] || { echo "⚠️  Email address is empty. Nothing changed."; exit 1; }
[ -n "$PASS" ] || { echo "⚠️  Password is empty. Nothing changed."; exit 1; }
case "$PORT" in ''|*[!0-9]*) echo "⚠️  Port must be a number. Nothing changed."; exit 1;; esac

cp "$CFG" "$CFG.bak.$(date +%s)"   # backup
export HOST PORT USER PASS TO
python3 - "$CFG" <<'PY'
import os, re, sys
path = sys.argv[1]
s = open(path, encoding='utf-8').read()
esc = lambda v: v.replace('\\', '\\\\').replace("'", "\\'")

strings = {'SMTP_HOST': os.environ['HOST'], 'SMTP_USER': os.environ['USER'],
           'SMTP_PASS': os.environ['PASS'], 'ORDER_EMAIL': os.environ['TO']}
for name, val in strings.items():
    line = "define('%s', '%s');" % (name, esc(val))
    s, n = re.subn(r"define\('" + name + r"',\s*'(?:\\.|[^'\\])*'\);", line, s, count=1)
    if n == 0:
        s = s.rstrip() + "\n" + line + "\n"      # constant not present yet

line = "define('SMTP_PORT', %d);" % int(os.environ['PORT'])
s, n = re.subn(r"define\('SMTP_PORT',\s*[^)]*\);", line, s, count=1)
if n == 0:
    s = s.rstrip() + "\n" + line + "\n"

open(path, 'w', encoding='utf-8').write(s)
PY

echo
echo "✅ Saved to config.php."
echo "   Host: $HOST:$PORT   User: $USER   Alerts to: $TO"
echo
echo "Now send a test email:"
echo "  php /home/cnc/test-order-email.php"

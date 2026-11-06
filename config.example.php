<?php
/* =========================================================================
   TroveMart — payment configuration
   -------------------------------------------------------------------------
   Fill these in ON THE SERVER (do not commit real keys to the project).

   1) STRIPE_SECRET_KEY  — from https://dashboard.stripe.com/apikeys
      Use your LIVE key (sk_live_...) once you're ready to take real payments,
      or a TEST key (sk_test_...) to trial it first.

   2) SITE_URL           — your site's base URL, no trailing slash.
   ========================================================================= */

define('STRIPE_SECRET_KEY', 'sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY');
define('SITE_URL', 'https://trovemart.co.uk');

/* --- Order notifications (webhook) --- */
// From Stripe: Developers → Webhooks → your endpoint → "Signing secret" (whsec_...)
define('STRIPE_WEBHOOK_SECRET', 'whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET');
// Where new-order emails are sent:
define('ORDER_EMAIL', 'info@mominkhanltd.com');
// Password to view orders at /orders.php  — CHANGE THIS to something strong:
define('ORDERS_ADMIN_PASSWORD', 'CHANGE_ME_to_a_strong_password');

/* ---------------------------------------------------------------------------
   SMTP — how order notification emails are sent.

   This server has no local mail transport, so PHP's mail() silently throws
   messages away. Without these set you will still get the order saved to
   /orders and visible on /orders.php, but no email will arrive.

   For Gmail / Google Workspace you must use an App Password (16 characters),
   not your normal password: Google Account -> Security -> 2-Step Verification
   -> App passwords. Run deploy/setup-email.sh to fill these in without
   putting the password on screen.
--------------------------------------------------------------------------- */
define('SMTP_HOST', 'REPLACE_WITH_SMTP_HOST');   // e.g. smtp.gmail.com
define('SMTP_PORT', 587);                        // 587 = TLS, 465 = SSL
define('SMTP_USER', 'REPLACE_WITH_SMTP_USERNAME'); // the full email address
define('SMTP_PASS', 'REPLACE_WITH_SMTP_PASSWORD'); // app password, not your login password

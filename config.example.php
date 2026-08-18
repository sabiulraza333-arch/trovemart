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

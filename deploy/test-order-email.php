<?php
/* Sends one test order email through whatever transport config.php describes,
   so the setup can be verified without waiting for a real order.
   Usage on the server:  php /home/cnc/test-order-email.php */

$root = '/var/www/html/trovemart';
require $root . '/config.php';

if (!defined('SMTP_HOST') || SMTP_HOST === '' || stripos(SMTP_HOST, 'REPLACE') !== false) {
    fwrite(STDERR, "SMTP is not configured in config.php — run setup-email.sh first.\n");
    exit(1);
}

require_once $root . '/vendor/phpmailer/Exception.php';
require_once $root . '/vendor/phpmailer/PHPMailer.php';
require_once $root . '/vendor/phpmailer/SMTP.php';

$body = "This is a test from TroveMart.\n\n"
      . "If you are reading this, order notification emails are working.\n"
      . "Real order emails will include the customer, the items and the delivery address.\n\n"
      . "Orders page: " . SITE_URL . "/orders.php\n";

try {
    $m = new \PHPMailer\PHPMailer\PHPMailer(true);
    $m->isSMTP();
    $m->Host       = SMTP_HOST;
    $m->Port       = defined('SMTP_PORT') ? (int) SMTP_PORT : 587;
    $m->SMTPAuth   = true;
    $m->Username   = SMTP_USER;
    $m->Password   = SMTP_PASS;
    $m->SMTPSecure = ($m->Port === 465) ? 'ssl' : 'tls';
    $m->CharSet    = 'UTF-8';
    $m->Timeout    = 20;
    $m->setFrom(SMTP_USER, 'TroveMart Orders');
    $m->addAddress(ORDER_EMAIL);
    $m->Subject = 'TroveMart — test order email';
    $m->Body    = $body;
    $m->send();
    echo "✅ Sent to " . ORDER_EMAIL . " via " . SMTP_HOST . ". Check the inbox (and spam).\n";
} catch (\Throwable $e) {
    // PHPMailer puts the useful detail in ErrorInfo rather than the exception
    fwrite(STDERR, "❌ Failed: " . $e->getMessage() . "\n");
    if (isset($m) && $m->ErrorInfo) fwrite(STDERR, "   " . $m->ErrorInfo . "\n");
    exit(1);
}

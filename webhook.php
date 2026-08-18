<?php
/* TroveMart — Stripe webhook: on a completed checkout it saves the order to
   /orders and emails the details to ORDER_EMAIL. Point Stripe at:
   https://trovemart.co.uk/webhook.php  (event: checkout.session.completed) */

require __DIR__ . '/config.php';
if (file_exists(__DIR__ . '/vendor/autoload.php')) require __DIR__ . '/vendor/autoload.php';
elseif (file_exists(__DIR__ . '/stripe-php/init.php')) require __DIR__ . '/stripe-php/init.php';
else { http_response_code(500); exit; }

\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

$payload = file_get_contents('php://input');
$sig     = isset($_SERVER['HTTP_STRIPE_SIGNATURE']) ? $_SERVER['HTTP_STRIPE_SIGNATURE'] : '';
try {
    $event = \Stripe\Webhook::constructEvent($payload, $sig, STRIPE_WEBHOOK_SECRET);
} catch (Exception $e) {
    http_response_code(400);
    exit('Invalid signature');
}

if ($event->type === 'checkout.session.completed') {
    $s = $event->data->object;

    // line items
    $items = [];
    try {
        $li = \Stripe\Checkout\Session::allLineItems($s->id, ['limit' => 100]);
        foreach ($li->data as $it) {
            $items[] = [
                'name'   => $it->description,
                'qty'    => $it->quantity,
                'amount' => number_format($it->amount_total / 100, 2),
            ];
        }
    } catch (Exception $e) { /* ignore */ }

    $cd   = isset($s->customer_details) ? $s->customer_details : null;
    $ship = isset($s->shipping_details) ? $s->shipping_details : null;
    $addr = ($ship && isset($ship->address)) ? $ship->address : null;

    $order = [
        'order_id' => $s->id,
        'date'     => date('Y-m-d H:i'),
        'name'     => $cd && $cd->name ? $cd->name : ($ship ? $ship->name : ''),
        'email'    => $cd && $cd->email ? $cd->email : '',
        'amount'   => number_format((isset($s->amount_total) ? $s->amount_total : 0) / 100, 2),
        'currency' => strtoupper(isset($s->currency) ? $s->currency : 'gbp'),
        'items'    => $items,
        'shipping' => $addr ? [
            'name'     => $ship->name,
            'line1'    => isset($addr->line1) ? $addr->line1 : '',
            'line2'    => isset($addr->line2) ? $addr->line2 : '',
            'city'     => isset($addr->city) ? $addr->city : '',
            'postcode' => isset($addr->postal_code) ? $addr->postal_code : '',
            'country'  => isset($addr->country) ? $addr->country : '',
        ] : null,
    ];

    // 1) save a record (not web-accessible — see nginx deny rule)
    $dir = __DIR__ . '/orders';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    @file_put_contents(
        $dir . '/' . date('Ymd_His') . '_' . substr($s->id, -8) . '.json',
        json_encode($order, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );

    // 2) email the order
    $lines = [
        "New TroveMart order 🎉", "",
        "Order:    " . $order['order_id'],
        "Date:     " . $order['date'],
        "Customer: " . $order['name'] . " <" . $order['email'] . ">",
        "Total:    £" . $order['amount'], "",
        "Items:",
    ];
    foreach ($items as $it) $lines[] = "  - " . $it['qty'] . " x " . $it['name'] . "  (£" . $it['amount'] . ")";
    if ($order['shipping']) {
        $sh = $order['shipping'];
        $lines[] = "";
        $lines[] = "Deliver to:";
        $lines[] = "  " . $sh['name'];
        $lines[] = "  " . trim($sh['line1'] . ($sh['line2'] ? ", " . $sh['line2'] : ""));
        $lines[] = "  " . trim($sh['city'] . " " . $sh['postcode']);
        $lines[] = "  " . $sh['country'];
    }
    $lines[] = "";
    $lines[] = "View all orders: " . SITE_URL . "/orders.php";

    $headers = "From: TroveMart Orders <orders@trovemart.co.uk>\r\n"
             . "Reply-To: " . $order['email'] . "\r\n"
             . "Content-Type: text/plain; charset=utf-8";
    @mail(ORDER_EMAIL, "New order — £" . $order['amount'] . " — TroveMart", implode("\n", $lines), $headers);
}

http_response_code(200);
echo json_encode(['received' => true]);

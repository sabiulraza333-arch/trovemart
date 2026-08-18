<?php
/* TroveMart — creates a Stripe Checkout Session from the cart and returns its URL.
   Prices are looked up SERVER-SIDE from assets/data/products.json so a customer
   cannot tamper with amounts in the browser. */

header('Content-Type: application/json');
require __DIR__ . '/config.php';

// Load the Stripe PHP library (composer OR the standalone download)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
} elseif (file_exists(__DIR__ . '/stripe-php/init.php')) {
    require __DIR__ . '/stripe-php/init.php';
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Payment library not installed yet.']);
    exit;
}

if (strpos(STRIPE_SECRET_KEY, 'REPLACE') !== false) {
    http_response_code(500);
    echo json_encode(['error' => 'Payments are not configured yet.']);
    exit;
}

// Read the posted cart
$body  = json_decode(file_get_contents('php://input'), true);
$items = (is_array($body) && !empty($body['items'])) ? $body['items'] : [];
if (!$items) {
    http_response_code(400);
    echo json_encode(['error' => 'Your cart is empty.']);
    exit;
}

// Trusted catalogue (id => name/price) generated from the site's products
$catalog = json_decode(@file_get_contents(__DIR__ . '/assets/data/products.json'), true);
if (!is_array($catalog)) {
    http_response_code(500);
    echo json_encode(['error' => 'Product catalogue unavailable.']);
    exit;
}
$map = [];
foreach ($catalog as $p) { $map[(string)$p['id']] = $p; }

// Build Stripe line items using SERVER prices only
$line_items = [];
foreach ($items as $it) {
    $id  = isset($it['id']) ? (string)$it['id'] : '';
    $qty = isset($it['qty']) ? max(1, min(20, (int)$it['qty'])) : 1;
    if (!isset($map[$id])) continue;
    $p = $map[$id];
    $line_items[] = [
        'price_data' => [
            'currency'     => 'gbp',
            'product_data' => ['name' => mb_substr($p['name'], 0, 250)],
            'unit_amount'  => (int) round(((float)$p['price']) * 100),
        ],
        'quantity' => $qty,
    ];
}
if (!$line_items) {
    http_response_code(400);
    echo json_encode(['error' => 'No valid items in your cart.']);
    exit;
}

\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
try {
    $session = \Stripe\Checkout\Session::create([
        'mode'                        => 'payment',
        'line_items'                  => $line_items,
        'success_url'                 => SITE_URL . '/success.html',
        'cancel_url'                  => SITE_URL . '/',
        'shipping_address_collection' => ['allowed_countries' => ['GB']],
        'billing_address_collection'  => 'auto',
    ]);
    echo json_encode(['url' => $session->url]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not start checkout. Please try again.']);
}

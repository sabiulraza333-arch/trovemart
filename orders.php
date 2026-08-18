<?php
/* TroveMart — simple password-protected order viewer. Reads saved orders from /orders. */
require __DIR__ . '/config.php';
session_start();

if (isset($_GET['logout'])) { $_SESSION = []; session_destroy(); header('Location: orders.php'); exit; }
$err = '';
if (isset($_POST['pw'])) {
    if (hash_equals(ORDERS_ADMIN_PASSWORD, (string)$_POST['pw'])) { $_SESSION['ok'] = true; header('Location: orders.php'); exit; }
    $err = 'Incorrect password.';
}
$authed = !empty($_SESSION['ok']);

$orders = [];
if ($authed) {
    $files = glob(__DIR__ . '/orders/*.json');
    if ($files) { rsort($files); foreach ($files as $f) { $o = json_decode(@file_get_contents($f), true); if ($o) $orders[] = $o; } }
}
function h($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
?><!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Orders — TroveMart</title>
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body{font-family:Inter,system-ui,sans-serif;background:#f5f7fb;color:#141c33;margin:0;padding:0}
  .bar{background:#16234d;color:#fff;padding:14px 22px;display:flex;justify-content:space-between;align-items:center}
  .bar b{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.15rem}
  .bar b span{color:#f0a500}
  .bar a{color:#cdd9f0;text-decoration:none;font-size:.9rem}
  .wrap{max-width:1000px;margin:0 auto;padding:26px 22px}
  .login{max-width:340px;margin:60px auto;background:#fff;border:1px solid #e6e9f2;border-radius:16px;padding:28px;box-shadow:0 6px 24px rgba(20,28,51,.08)}
  .login h1{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.3rem;margin:0 0 4px}
  .login p{color:#67718a;margin:0 0 18px;font-size:.9rem}
  .login input{width:100%;box-sizing:border-box;padding:.7em .9em;border:1px solid #e6e9f2;border-radius:10px;font:inherit;margin-bottom:12px}
  .login button{width:100%;padding:.8em;background:#f0a500;color:#20160a;border:0;border-radius:999px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer}
  .err{color:#c0392b;font-size:.85rem;margin-bottom:10px}
  h1.title{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.5rem;margin:0 0 4px}
  .sub{color:#67718a;margin:0 0 22px}
  .order{background:#fff;border:1px solid #e6e9f2;border-radius:14px;padding:18px 20px;margin-bottom:16px;box-shadow:0 4px 16px rgba(20,28,51,.06)}
  .order-top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;border-bottom:1px solid #eef1f7;padding-bottom:10px;margin-bottom:12px}
  .order-top .amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;color:#16234d}
  .meta{font-size:.9rem;color:#39465f;line-height:1.6}
  .meta b{color:#141c33}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .cols h3{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin:0 0 8px}
  ul{margin:0;padding-left:18px}li{margin:3px 0;font-size:.9rem}
  .empty{text-align:center;color:#67718a;padding:60px 20px}
  @media(max-width:640px){.cols{grid-template-columns:1fr}}
</style>

<div class="bar">
  <b>Trove<span>Mart</span> · Orders</b>
  <?php if ($authed): ?><a href="orders.php?logout=1">Log out</a><?php endif; ?>
</div>

<?php if (!$authed): ?>
  <form class="login" method="post">
    <h1>Order dashboard</h1>
    <p>Enter the admin password to view orders.</p>
    <?php if ($err): ?><div class="err"><?= h($err) ?></div><?php endif; ?>
    <input type="password" name="pw" placeholder="Password" autofocus required>
    <button type="submit">View orders</button>
  </form>
<?php else: ?>
  <div class="wrap">
    <h1 class="title">Orders</h1>
    <p class="sub"><?= count($orders) ?> order<?= count($orders) === 1 ? '' : 's' ?> total · newest first</p>
    <?php if (!$orders): ?>
      <div class="empty">No orders yet. New orders will appear here automatically once a customer checks out.</div>
    <?php else: foreach ($orders as $o): ?>
      <div class="order">
        <div class="order-top">
          <div class="meta"><b><?= h($o['name'] ?: 'Customer') ?></b> &nbsp;·&nbsp; <?= h($o['email']) ?><br><?= h($o['date']) ?> &nbsp;·&nbsp; <?= h($o['order_id']) ?></div>
          <div class="amt">£<?= h($o['amount']) ?></div>
        </div>
        <div class="cols">
          <div>
            <h3>Items</h3>
            <ul>
              <?php foreach (($o['items'] ?: []) as $it): ?>
                <li><?= (int)$it['qty'] ?> × <?= h($it['name']) ?> <span style="color:#67718a">(£<?= h($it['amount']) ?>)</span></li>
              <?php endforeach; ?>
            </ul>
          </div>
          <div>
            <h3>Deliver to</h3>
            <?php if (!empty($o['shipping'])): $s = $o['shipping']; ?>
              <div class="meta"><?= h($s['name']) ?><br><?= h($s['line1']) ?><?= $s['line2'] ? '<br>' . h($s['line2']) : '' ?><br><?= h($s['city']) ?> <?= h($s['postcode']) ?><br><?= h($s['country']) ?></div>
            <?php else: ?><div class="meta" style="color:#94a3b8">No shipping address</div><?php endif; ?>
          </div>
        </div>
      </div>
    <?php endforeach; endif; ?>
  </div>
<?php endif; ?>

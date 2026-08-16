<?php
declare(strict_types=1);

require dirname(__DIR__) . '/private/bootstrap.php';

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = rtrim($path, '/') ?: '/';
$isAdmin = $path === '/admin';
$isLogin = $path === '/admin/login';

if ($isAdmin && empty($_SESSION['paperly_admin'])) {
    header('Location: /admin/login', true, 302);
    exit;
}
if ($isLogin && !empty($_SESSION['paperly_admin'])) {
    header('Location: /admin', true, 302);
    exit;
}

header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Paperly - private, browser-based PDF tools.">
  <title>Paperly - Simple PDF Tools</title>
  <link rel="stylesheet" href="/assets/app.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/app.js"></script>
</body>
</html>

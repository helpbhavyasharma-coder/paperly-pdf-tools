<?php
declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Paperly PHP configuration is missing. Copy config.php.example to config.php and add the admin credentials.');
}

$config = require $configFile;
if (!is_array($config)) {
    http_response_code(500);
    exit('Paperly PHP configuration is invalid.');
}

$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name((string)($config['session_name'] ?? 'paperly_admin'));
session_set_cookie_params([
    'lifetime' => 8 * 60 * 60,
    'path' => '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

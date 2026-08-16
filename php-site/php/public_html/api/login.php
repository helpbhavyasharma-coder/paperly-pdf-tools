<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/private/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$input = json_decode(file_get_contents('php://input') ?: '', true);
$email = strtolower(trim((string)($input['email'] ?? '')));
$password = (string)($input['password'] ?? '');

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Enter both email and password.']);
    exit;
}

if ($config['admin_email'] === '' || $config['admin_password_hash'] === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Admin credentials are not configured yet.']);
    exit;
}

if (!hash_equals(strtolower($config['admin_email']), $email) || !password_verify($password, $config['admin_password_hash'])) {
    usleep(300000);
    http_response_code(401);
    echo json_encode(['error' => 'Email or password is incorrect.']);
    exit;
}

session_regenerate_id(true);
$_SESSION['paperly_admin'] = ['email' => $email, 'signed_in_at' => time()];
echo json_encode(['ok' => true]);

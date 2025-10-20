<?php
require_once __DIR__ . '/config.php';

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$username = trim($input['username'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$confirm = $input['confirm_password'] ?? '';

if (empty($username) || empty($email) || empty($password) || empty($confirm)) {
    echo json_encode(['error' => 'Missing fields']);
    exit;
}
if ($password !== $confirm) {
    echo json_encode(['error' => 'Passwords do not match']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['error' => 'Password too short']);
    exit;
}
if (strlen($username) < 3) {
    echo json_encode(['error' => 'Username must be at least 3 characters']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

// Check if username exists
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
if ($stmt->fetch()) {
    echo json_encode(['error' => 'Username already exists']);
    exit;
}

// Check if email exists
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(['error' => 'Email already exists']);
    exit;
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO usuarios (username, email, password_hash) VALUES (?, ?, ?)');
try {
    $stmt->execute([$username, $email, $password_hash]);
    $id = $pdo->lastInsertId();
    $_SESSION['user_id'] = (int)$id;
    $_SESSION['email'] = $email;
    $_SESSION['username'] = $username;
    echo json_encode(['ok' => true, 'user' => ['id' => $id, 'username' => $username, 'email' => $email]]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Failed to create user: ' . $e->getMessage()]);
}

?>
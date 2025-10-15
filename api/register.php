<?php
require_once __DIR__ . '/config.php';

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';
$confirm = $input['confirm_password'] ?? '';

if (empty($username) || empty($password) || empty($confirm)) {
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

// Check if username or email exists
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE username = ? OR email = ? LIMIT 1');
$stmt->execute([$username, $username]);
if ($stmt->fetch()) {
    echo json_encode(['error' => 'User already exists']);
    exit;
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO usuarios (username, password_hash) VALUES (?, ?)');
try {
    $stmt->execute([$username, $password_hash]);
    $id = $pdo->lastInsertId();
    $_SESSION['user_id'] = (int)$id;
    $_SESSION['username'] = $username;
    echo json_encode(['ok' => true, 'user' => ['id' => $id, 'username' => $username]]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Failed to create user: ' . $e->getMessage()]);
}

?>

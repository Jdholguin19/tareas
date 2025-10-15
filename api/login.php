<?php
require_once __DIR__ . '/config.php';

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['error' => 'Missing credentials']);
    exit;
}

// Fetch user (allow login by username or email)
$stmt = $pdo->prepare('SELECT id, username, password_hash FROM usuarios WHERE username = ? OR email = ? LIMIT 1');
$stmt->execute([$username, $username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password_hash'])) {
    // Store minimal session info
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = $user['username'];
    echo json_encode(['ok' => true, 'user' => ['id' => $user['id'], 'username' => $user['username']]]);
} else {
    echo json_encode(['error' => 'Invalid credentials']);
}

?>

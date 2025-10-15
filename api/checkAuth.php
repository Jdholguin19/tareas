<?php
require_once __DIR__ . '/config.php';

if (isset($_SESSION['user_id'])) {
    echo json_encode(['authenticated' => true, 'user' => ['id' => $_SESSION['user_id'], 'username' => $_SESSION['username'] ?? null]]);
} else {
    echo json_encode(['authenticated' => false]);
}

?>

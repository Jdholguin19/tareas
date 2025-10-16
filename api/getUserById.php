<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_GET['id'] ?? null;

if (!$userId) {
    echo json_encode(['error' => 'User ID is required']);
    exit;
}

try {
    // Obtener información del usuario por ID
    $stmt = $pdo->prepare("SELECT id, username, email FROM usuarios WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['error' => 'Usuario no encontrado']);
        exit;
    }

    echo json_encode($user);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
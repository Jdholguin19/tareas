<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Obtener información del usuario actual incluyendo rol_id
    $stmt = $pdo->prepare("SELECT id, username, email, rol_id FROM usuarios WHERE id = ?");
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
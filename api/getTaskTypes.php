<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT id, nombre, descripcion, color, icono, activo
        FROM tipos_tareas
        WHERE activo = 1
        ORDER BY id ASC
    ");
    $stmt->execute();
    $taskTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($taskTypes);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

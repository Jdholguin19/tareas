<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(['error' => 'Task ID is required']);
    exit;
}

try {
    // Check if task exists and belongs to the user
    $stmtCheck = $pdo->prepare("SELECT id FROM tareas WHERE id = ? AND creado_por = ?");
    $stmtCheck->execute([$id, $userId]);
    $task = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        echo json_encode(['error' => 'Task not found or you do not have permission to delete it']);
        exit;
    }

    // Delete the task
    $stmt = $pdo->prepare("DELETE FROM tareas WHERE id = ? AND creado_por = ?");
    $stmt->execute([$id, $userId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
    } else {
        echo json_encode(['error' => 'Failed to delete task']);
    }

} catch (Exception $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
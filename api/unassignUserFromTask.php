<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$taskId = $data['taskId'] ?? null;
$assigneeId = $data['assigneeId'] ?? null;

if (!$taskId || !$assigneeId) {
    echo json_encode(['error' => 'Task ID and Assignee ID are required']);
    exit;
}

// Verificar que el usuario tenga permisos para quitar asignaciones (solo el creador puede quitar)
$stmt = $pdo->prepare("SELECT id FROM tareas WHERE id = ? AND creado_por = ?");
$stmt->execute([$taskId, $userId]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    echo json_encode(['error' => 'Task not found or no permission to unassign']);
    exit;
}

try {
    // Eliminar la asignación
    $stmt = $pdo->prepare("
        DELETE FROM tareas_asignados
        WHERE tarea_id = ? AND usuario_id = ?
    ");
    $stmt->execute([$taskId, $assigneeId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'User unassigned successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'User was not assigned']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
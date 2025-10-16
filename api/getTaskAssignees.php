<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];
$taskId = $_GET['taskId'] ?? null;

if (!$taskId) {
    echo json_encode(['error' => 'Task ID is required']);
    exit;
}

// Verificar que el usuario tenga permisos para ver los asignados (creador o asignado)
$stmt = $pdo->prepare("
    SELECT id FROM tareas
    WHERE id = ? AND (creado_por = ? OR id IN (
        SELECT tarea_id FROM tareas_asignados WHERE usuario_id = ?
    ))
");
$stmt->execute([$taskId, $userId, $userId]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    echo json_encode(['error' => 'Task not found or no permission']);
    exit;
}

try {
    // Obtener todos los usuarios asignados a la tarea
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.email, ta.fecha_asignacion
        FROM tareas_asignados ta
        JOIN usuarios u ON ta.usuario_id = u.id
        WHERE ta.tarea_id = ?
        ORDER BY ta.fecha_asignacion ASC
    ");
    $stmt->execute([$taskId]);
    $assignedUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($assignedUsers);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
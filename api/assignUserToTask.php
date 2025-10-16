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

// Verificar que el usuario tenga permisos para asignar (creador o asignado)
$stmt = $pdo->prepare("
    SELECT id FROM tareas t
    WHERE t.id = ? AND (t.creado_por = ? OR EXISTS (
        SELECT 1 FROM tareas_asignados ta WHERE ta.tarea_id = t.id AND ta.usuario_id = ?
    ))
");
$stmt->execute([$taskId, $userId, $userId]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    echo json_encode(['error' => 'Task not found or no permission to assign']);
    exit;
}

// Verificar que el usuario a asignar existe y está activo
$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE id = ? AND estado = 'activo'");
$stmt->execute([$assigneeId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['error' => 'User not found or inactive']);
    exit;
}

try {
    // Insertar la asignación (usando INSERT IGNORE para evitar duplicados)
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO tareas_asignados (tarea_id, usuario_id)
        VALUES (?, ?)
    ");
    $stmt->execute([$taskId, $assigneeId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'User assigned successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'User already assigned']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
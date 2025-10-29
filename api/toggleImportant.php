<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

// Obtener datos del request
$data = json_decode(file_get_contents('php://input'), true);
$taskId = $data['taskId'] ?? null;

if (!$taskId) {
    echo json_encode(['error' => 'ID de tarea requerido']);
    exit;
}

try {
    // Verificar que el usuario tenga permisos para modificar la tarea
    $stmt = $pdo->prepare("
        SELECT t.*, t.prioridad 
        FROM tareas t
        WHERE t.id = ? AND (t.creado_por = ? OR EXISTS (
            SELECT 1 FROM tareas_asignados ta WHERE ta.tarea_id = t.id AND ta.usuario_id = ?
        ))
    ");
    $stmt->execute([$taskId, $userId, $userId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        echo json_encode(['error' => 'Tarea no encontrada o sin permisos']);
        exit;
    }

    // Alternar la prioridad: si es 'alta' cambiar a 'media', si no es 'alta' cambiar a 'alta'
    $newPriority = ($task['prioridad'] === 'alta') ? 'media' : 'alta';

    // Actualizar la prioridad
    $stmt = $pdo->prepare("
        UPDATE tareas 
        SET prioridad = ? 
        WHERE id = ?
    ");
    $stmt->execute([$newPriority, $taskId]);

    echo json_encode([
        'success' => true,
        'taskId' => $taskId,
        'newPriority' => $newPriority,
        'isImportant' => $newPriority === 'alta'
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
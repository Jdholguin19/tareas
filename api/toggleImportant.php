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
        SELECT t.*, t.importancia 
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

    // Alternar la IMPORTANCIA: si es 'alta' cambiar a 'baja', si no es 'alta' cambiar a 'alta'
    $newImportance = ($task['importancia'] === 'alta') ? 'baja' : 'alta';

    // Actualizar la IMPORTANCIA
    $stmt = $pdo->prepare("
        UPDATE tareas 
        SET importancia = ? 
        WHERE id = ?
    ");
    $stmt->execute([$newImportance, $taskId]);

    echo json_encode([
        'success' => true,
        'taskId' => $taskId,
        'newImportance' => $newImportance,
        'isImportant' => $newImportance === 'alta'
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
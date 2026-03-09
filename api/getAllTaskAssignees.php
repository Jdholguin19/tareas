<?php
require_once 'config.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

// Obtener todos los asignados de todas las tareas visibles para el usuario
try {
    // Obtener todas las tareas que el usuario puede ver
    $stmt = $pdo->prepare("
        SELECT DISTINCT t.id as tarea_id
        FROM tareas t
        WHERE (
            -- Es creador de la tarea
            t.creado_por = ? 
            -- Es asignado a la tarea
            OR t.id IN (
                SELECT tarea_id FROM tareas_asignados WHERE usuario_id = ?
            )
            -- La tarea pertenece a un proyecto donde el usuario está asignado
            OR t.proyecto_id IN (
                SELECT DISTINCT t2.proyecto_id 
                FROM tareas t2
                LEFT JOIN tareas_asignados ta2 ON t2.id = ta2.tarea_id
                WHERE t2.creado_por = ? OR ta2.usuario_id = ?
            )
            -- Es del mismo departamento
            OR EXISTS (
                SELECT 1 FROM usuarios u1, usuarios u2
                WHERE u1.id = ? AND u2.id = t.creado_por
                AND u1.departamento_id = u2.departamento_id
                AND u1.departamento_id IS NOT NULL
            )
            -- Es admin
            OR EXISTS (
                SELECT 1 FROM usuarios WHERE id = ? AND rol_id = 2
            )
        )
    ");
    $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId]);
    $visibleTaskIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($visibleTaskIds)) {
        echo json_encode([]);
        exit;
    }

    // Obtener todos los asignados de las tareas visibles
    $placeholders = str_repeat('?,', count($visibleTaskIds) - 1) . '?';
    $stmt = $pdo->prepare("
        SELECT 
            ta.tarea_id,
            u.id,
            u.username
        FROM tareas_asignados ta
        JOIN usuarios u ON ta.usuario_id = u.id
        WHERE ta.tarea_id IN ($placeholders)
        ORDER BY ta.tarea_id, ta.fecha_asignacion ASC
    ");
    $stmt->execute($visibleTaskIds);
    $assignees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Agrupar por tarea_id
    $result = [];
    foreach ($assignees as $assignee) {
        $taskId = $assignee['tarea_id'];
        if (!isset($result[$taskId])) {
            $result[$taskId] = [];
        }
        $result[$taskId][] = [
            'id' => (int)$assignee['id'],
            'username' => $assignee['username']
        ];
    }

    echo json_encode($result);
} catch (Exception $e) {
    error_log("Error in getAllTaskAssignees: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>

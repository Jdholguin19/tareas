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

// Verificar que el usuario tenga permisos para ver los asignados
// Permisos: creador, asignado, o pertenece a un proyecto donde está asignado
$stmt = $pdo->prepare("
    SELECT t.id, t.proyecto_id
    FROM tareas t
    WHERE t.id = ? AND (
        -- Es creador de la tarea
        t.creado_por = ? 
        -- Es asignado a la tarea
        OR t.id IN (
            SELECT tarea_id FROM tareas_asignados WHERE usuario_id = ?
        )
        -- La tarea pertenece a un proyecto donde el usuario está asignado a alguna tarea
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
$stmt->execute([$taskId, $userId, $userId, $userId, $userId, $userId, $userId]);
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
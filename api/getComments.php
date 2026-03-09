<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];
$taskId = isset($_GET['taskId']) ? intval($_GET['taskId']) : null;
$sinceId = isset($_GET['since_id']) ? intval($_GET['since_id']) : null;

if (!$taskId) {
    echo json_encode(['error' => 'taskId requerido']);
    exit;
}

try {
    // Permiso: el usuario debe ser creador o asignado o admin
    $stmt = $pdo->prepare("SELECT id FROM tareas WHERE id = ? AND (creado_por = ? OR id IN (SELECT tarea_id FROM tareas_asignados WHERE usuario_id = ?) OR EXISTS(SELECT 1 FROM usuarios WHERE id = ? AND rol_id = 2))");
    $stmt->execute([$taskId, $userId, $userId, $userId]);
    $ok = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$ok) {
        echo json_encode(['error' => 'No tiene permisos para ver los comentarios']);
        exit;
    }

    if ($sinceId) {
        $stmt = $pdo->prepare("SELECT c.id, c.tarea_id, c.usuario_id, u.username, c.contenido, c.fecha_creacion FROM comentarios c LEFT JOIN usuarios u ON c.usuario_id = u.id WHERE c.tarea_id = ? AND c.id > ? ORDER BY c.id ASC");
        $stmt->execute([$taskId, $sinceId]);
    } else {
        $stmt = $pdo->prepare("SELECT c.id, c.tarea_id, c.usuario_id, u.username, c.contenido, c.fecha_creacion FROM comentarios c LEFT JOIN usuarios u ON c.usuario_id = u.id WHERE c.tarea_id = ? ORDER BY c.fecha_creacion ASC");
        $stmt->execute([$taskId]);
    }
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($comments);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

?>

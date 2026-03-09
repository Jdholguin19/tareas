<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true);
$taskId = isset($input['taskId']) ? intval($input['taskId']) : null;
$content = isset($input['content']) ? trim($input['content']) : '';

if (!$taskId || $content === '') {
    echo json_encode(['error' => 'taskId y content son requeridos']);
    exit;
}

try {
    // Permiso: solo creador o asignados pueden comentar
    $stmt = $pdo->prepare("SELECT id, creado_por FROM tareas WHERE id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$task) {
        echo json_encode(['error' => 'Tarea no encontrada']);
        exit;
    }

    $isCreator = ($task['creado_por'] == $userId);
    $stmt = $pdo->prepare("SELECT 1 FROM tareas_asignados WHERE tarea_id = ? AND usuario_id = ?");
    $stmt->execute([$taskId, $userId]);
    $isAssigned = (bool)$stmt->fetch(PDO::FETCH_COLUMN);

    if (!($isCreator || $isAssigned)) {
        echo json_encode(['error' => 'No tiene permisos para comentar esta tarea']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO comentarios (tarea_id, usuario_id, contenido, fecha_creacion) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$taskId, $userId, $content]);
    $newId = $pdo->lastInsertId();

    // Return the created comment
    $stmt = $pdo->prepare("SELECT c.id, c.tarea_id, c.usuario_id, u.username, c.contenido, c.fecha_creacion FROM comentarios c LEFT JOIN usuarios u ON c.usuario_id = u.id WHERE c.id = ?");
    $stmt->execute([$newId]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'comment' => $comment]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

?>

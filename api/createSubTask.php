<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

$parentId = $_GET['parentId'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);
$titulo = $data['titulo'] ?? '';

if (!$parentId || empty($titulo)) {
    echo json_encode(['error' => 'Parent ID and title are required']);
    exit;
}

try {
    // Check if parent task exists and belongs to the user
    $stmt = $pdo->prepare("SELECT * FROM tareas WHERE id = ? AND creado_por = ?");
    $stmt->execute([$parentId, $userId]);
    $parent = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$parent) {
        echo json_encode(['error' => 'Parent task not found or you do not have permission to create subtasks']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO tareas (titulo, descripcion, estado, progreso, fecha_creacion, creado_por, tarea_padre_id, proyecto_id, asignado_a, fecha_vencimiento, adjuntos_url)
        VALUES (?, NULL, 'pendiente', 0, NOW(), ?, ?, ?, ?, ?, '[]')
    ");
    $stmt->execute([$titulo, $userId, $parentId, $parent['proyecto_id'], $parent['asignado_a'], $parent['fecha_vencimiento']]);
    $taskId = $pdo->lastInsertId();

    $stmt = $pdo->prepare("
        SELECT 
            t.id AS ID,
            t.titulo AS Titulo,
            t.descripcion AS Descripcion,
            t.estado AS Estado,
            t.progreso AS Porcentaje_Avance,
            t.fecha_creacion AS Fecha_Creacion,
            t.fecha_vencimiento AS Fecha_Vencimiento,
            t.fecha_inicio AS Fecha_Inicio,
            t.fecha_completada AS Fecha_Completada,
            t.creado_por AS Usuario_Creador_ID,
            t.asignado_a AS Usuario_Asignado_ID,
            COALESCE(p.nombre, 'General') AS Proyecto,
            t.tarea_padre_id AS Parent_ID,
            t.adjuntos_url AS Adjuntos_URL
        FROM tareas t
        LEFT JOIN proyectos p ON t.proyecto_id = p.id
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $task['Adjuntos_URL'] = json_decode($task['Adjuntos_URL'] ?? '[]', true);

    echo json_encode($task);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
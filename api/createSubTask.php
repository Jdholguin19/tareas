<?php
require_once 'config.php';

$parentId = $_GET['parentId'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);
$titulo = $data['titulo'] ?? '';

if (!$parentId || empty($titulo)) {
    echo json_encode(['error' => 'Parent ID and title are required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM tareas WHERE id = ?");
    $stmt->execute([$parentId]);
    $parent = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$parent) {
        echo json_encode(['error' => 'Parent task not found']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO tareas (titulo, descripcion, estado, progreso, fecha_creacion, creado_por, tarea_padre_id, proyecto_id, asignado_a, fecha_vencimiento, adjuntos_url)
        VALUES (?, NULL, 'pendiente', 0, NOW(), 1, ?, ?, ?, ?, '[]')
    ");
    $stmt->execute([$titulo, $parentId, $parent['proyecto_id'], $parent['asignado_a'], $parent['fecha_vencimiento']]);
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
<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$titulo = $data['titulo'] ?? '';
$adjuntos = $data['adjuntos'] ?? [];

if (empty($titulo)) {
    echo json_encode(['error' => 'Title is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO tareas (titulo, descripcion, estado, progreso, fecha_creacion, creado_por, adjuntos_url, tarea_padre_id)
        VALUES (?, NULL, 'pendiente', 0, NOW(), 1, ?, NULL)
    ");
    $stmt->execute([$titulo, json_encode($adjuntos)]);
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
    
    // Convert Adjuntos_URL to array
    $task['Adjuntos_URL'] = json_decode($task['Adjuntos_URL'] ?? '[]', true);

    echo json_encode($task);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
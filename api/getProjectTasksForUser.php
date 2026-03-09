<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Obtener TODAS las tareas de proyectos donde el usuario tiene al menos una tarea asignada
    $stmt = $pdo->prepare("
        SELECT DISTINCT
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
            t.proyecto_id AS Proyecto,
            t.tarea_padre_id AS Parent_ID,
            t.adjuntos_url AS Adjuntos_URL,
            t.tipos_tareas_id AS Tipos_Tareas_ID,
            t.prioridad AS Prioridad,
            t.importancia AS Importancia,
            u.username AS asignado_a_username,
            p.nombre AS proyecto_nombre
        FROM tareas t
        LEFT JOIN usuarios u ON t.asignado_a = u.id
        LEFT JOIN proyectos p ON t.proyecto_id = p.id
        WHERE t.proyecto_id IN (
            SELECT DISTINCT t2.proyecto_id 
            FROM tareas t2
            LEFT JOIN tareas_asignados ta2 ON t2.id = ta2.tarea_id
            WHERE t2.creado_por = ? OR ta2.usuario_id = ?
        )
        ORDER BY 
            CASE t.prioridad 
                WHEN 'alta' THEN 1 
                WHEN 'media' THEN 2 
                WHEN 'baja' THEN 3 
            END,
            t.fecha_creacion DESC
    ");
    $stmt->execute([$userId, $userId]);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert Adjuntos_URL from JSON string to array
    foreach ($tasks as &$task) {
        $task['Adjuntos_URL'] = json_decode($task['Adjuntos_URL'] ?? '[]', true);
    }

    echo json_encode($tasks);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

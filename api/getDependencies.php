<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Obtener todas las dependencias con información de las tareas relacionadas
    $stmt = $pdo->prepare("
        SELECT 
            d.id,
            d.tarea_predecesora_id,
            d.tarea_sucesora_id,
            d.tipo_dependencia,
            d.retraso_dias,
            d.descripcion,
            d.fecha_creacion,
            tp.titulo AS tarea_predecesora_titulo,
            tp.estado AS tarea_predecesora_estado,
            tp.fecha_inicio AS tarea_predecesora_inicio,
            tp.fecha_vencimiento AS tarea_predecesora_fin,
            ts.titulo AS tarea_sucesora_titulo,
            ts.estado AS tarea_sucesora_estado,
            ts.fecha_inicio AS tarea_sucesora_inicio,
            ts.fecha_vencimiento AS tarea_sucesora_fin,
            p.nombre AS proyecto_nombre
        FROM dependencias_tareas d
        INNER JOIN tareas tp ON d.tarea_predecesora_id = tp.id
        INNER JOIN tareas ts ON d.tarea_sucesora_id = ts.id
        LEFT JOIN proyectos p ON tp.proyecto_id = p.id
        WHERE (tp.creado_por = :userId OR ts.creado_por = :userId 
               OR tp.asignado_a = :userId OR ts.asignado_a = :userId
               OR EXISTS (
                   SELECT 1 FROM tareas_asignados ta1 WHERE ta1.tarea_id = tp.id AND ta1.usuario_id = :userId
               )
               OR EXISTS (
                   SELECT 1 FROM tareas_asignados ta2 WHERE ta2.tarea_id = ts.id AND ta2.usuario_id = :userId
               ))
        ORDER BY d.fecha_creacion DESC
    ");
    
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $dependencies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear la respuesta
    $formattedDependencies = array_map(function($dep) {
        return [
            'id' => (int)$dep['id'],
            'tarea_predecesora_id' => (int)$dep['tarea_predecesora_id'],
            'tarea_sucesora_id' => (int)$dep['tarea_sucesora_id'],
            'tipo_dependencia' => $dep['tipo_dependencia'],
            'retraso_dias' => (int)$dep['retraso_dias'],
            'descripcion' => $dep['descripcion'],
            'fecha_creacion' => $dep['fecha_creacion'],
            'tarea_predecesora' => [
                'titulo' => $dep['tarea_predecesora_titulo'],
                'estado' => $dep['tarea_predecesora_estado'],
                'fecha_inicio' => $dep['tarea_predecesora_inicio'],
                'fecha_fin' => $dep['tarea_predecesora_fin']
            ],
            'tarea_sucesora' => [
                'titulo' => $dep['tarea_sucesora_titulo'],
                'estado' => $dep['tarea_sucesora_estado'],
                'fecha_inicio' => $dep['tarea_sucesora_inicio'],
                'fecha_fin' => $dep['tarea_sucesora_fin']
            ],
            'proyecto_nombre' => $dep['proyecto_nombre']
        ];
    }, $dependencies);
    
    echo json_encode([
        'success' => true,
        'dependencies' => $formattedDependencies,
        'total' => count($formattedDependencies)
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'error' => 'Error al obtener dependencias: ' . $e->getMessage()
    ]);
}
?>
<?php
require_once 'config.php';

$id = $_GET['id'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);

if (!$id) {
    echo json_encode(['error' => 'Task ID is required']);
    exit;
}

try {
    // First, get the current task data to check current proyecto_id
    $stmtCurrent = $pdo->prepare("SELECT proyecto_id FROM tareas WHERE id = ?");
    $stmtCurrent->execute([$id]);
    $currentTask = $stmtCurrent->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentTask) {
        echo json_encode(['error' => 'Task not found']);
        exit;
    }

    $fieldMapping = [
        'ID' => 'id',
        'Titulo' => 'titulo',
        'Descripcion' => 'descripcion',
        'Estado' => 'estado',
        'Porcentaje_Avance' => 'progreso',
        'Fecha_Creacion' => 'fecha_creacion',
        'Fecha_Vencimiento' => 'fecha_vencimiento',
        'Fecha_Inicio' => 'fecha_inicio',
        'Fecha_Completada' => 'fecha_completada',
        'Usuario_Creador_ID' => 'creado_por',
        'Usuario_Asignado_ID' => 'asignado_a',
        'Proyecto' => 'proyecto_id',
        'Parent_ID' => 'tarea_padre_id',
        'Adjuntos_URL' => 'adjuntos_url'
    ];

    $fields = [];
    $values = [];
    foreach ($data as $key => $value) {
        if (isset($fieldMapping[$key])) {
            $dbKey = $fieldMapping[$key];
            if ($key === 'Parent_ID' && $value == 0) {
                $value = NULL;
            }
            if ($key === 'Proyecto') {
                if ($value === null || $value === '') {
                    // Allow setting proyecto_id to NULL
                    $value = NULL;
                } elseif ($value == $currentTask['proyecto_id']) {
                    // Same value, no need to update
                    continue;
                } elseif (!is_numeric($value)) {
                    // Skip invalid values
                    continue;
                } else {
                    // Validate that the project exists
                    $stmtCheck = $pdo->prepare("SELECT id FROM proyectos WHERE id = ?");
                    $stmtCheck->execute([$value]);
                    if ($stmtCheck->rowCount() === 0) {
                        // Project doesn't exist, skip this field
                        continue;
                    }
                }
            }
            if (is_array($value)) {
                $value = json_encode($value);
            }
            $fields[] = "$dbKey = ?";
            $values[] = $value;
        }
    }
    $values[] = $id;

    $stmt = $pdo->prepare("UPDATE tareas SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);

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
    $stmt->execute([$id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $task['Adjuntos_URL'] = json_decode($task['Adjuntos_URL'] ?? '[]', true);

    echo json_encode($task);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
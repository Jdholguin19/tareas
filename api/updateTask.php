<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

$id = $_GET['id'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);

if (!$id) {
    echo json_encode(['error' => 'Task ID is required']);
    exit;
}

try {
    // First, get the current task data and verify ownership
    $stmtCurrent = $pdo->prepare("SELECT proyecto_id, creado_por, estado, fecha_vencimiento, fecha_completada FROM tareas WHERE id = ?");
    $stmtCurrent->execute([$id]);
    $currentTask = $stmtCurrent->fetch(PDO::FETCH_ASSOC);

    if (!$currentTask) {
        echo json_encode(['error' => 'Task not found']);
        exit;
    }

    // Verificar que el usuario tenga permisos para editar (creador o asignado)
    $stmtPermisos = $pdo->prepare("
        SELECT 1 FROM tareas t
        WHERE t.id = ? AND (t.creado_por = ? OR EXISTS (
            SELECT 1 FROM tareas_asignados ta WHERE ta.tarea_id = t.id AND ta.usuario_id = ?
        ))
    ");
    $stmtPermisos->execute([$id, $userId, $userId]);
    
    if ($stmtPermisos->rowCount() === 0) {
        echo json_encode(['error' => 'No tienes permiso para modificar esta tarea']);
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
        'Adjuntos_URL' => 'adjuntos_url',
        'Prioridad' => 'prioridad',
        'Importancia' => 'importancia'
    ];

    // Auto-set completion/due date when marking as completed
    $markCompleted = false;
    if (isset($data['Estado']) && strtolower(trim($data['Estado'])) === 'completada') {
        $markCompleted = true;
    } elseif (isset($data['Porcentaje_Avance']) && floatval($data['Porcentaje_Avance']) >= 100) {
        $markCompleted = true;
    }

    if ($markCompleted) {
        // Set completion date to today if not provided
        if (!isset($data['Fecha_Completada']) || empty($data['Fecha_Completada'])) {
            $data['Fecha_Completada'] = date('Y-m-d');
        }
        // If task has no due date, default due date to today
        if (
            (!isset($data['Fecha_Vencimiento']) || $data['Fecha_Vencimiento'] === null || $data['Fecha_Vencimiento'] === '')
            && (empty($currentTask['fecha_vencimiento']))
        ) {
            $data['Fecha_Vencimiento'] = date('Y-m-d');
        }
    }

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
            t.proyecto_id AS Proyecto,
            t.tarea_padre_id AS Parent_ID,
            t.adjuntos_url AS Adjuntos_URL,
            t.prioridad AS Prioridad,
            t.importancia AS Importancia,
            p.nombre AS proyecto_nombre
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
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
    // Check if parent task exists and user has permission (creator or assigned)
    $stmt = $pdo->prepare("
        SELECT t.* FROM tareas t
        WHERE t.id = ? AND (t.creado_por = ? OR EXISTS (
            SELECT 1 FROM tareas_asignados ta WHERE ta.tarea_id = t.id AND ta.usuario_id = ?
        ))
    ");
    $stmt->execute([$parentId, $userId, $userId]);
    $parent = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$parent) {
        echo json_encode(['error' => 'Parent task not found or you do not have permission to create subtasks']);
        exit;
    }

    // Iniciar transacción para asegurar que tanto la tarea como las asignaciones se creen
    $pdo->beginTransaction();

    // Crear la subtarea
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

    // Obtener el creador de la tarea raíz (recorrer hacia arriba en el árbol)
    $rootCreatorId = null;
    $currentTaskId = $parentId;
    
    while ($currentTaskId) {
        $stmt = $pdo->prepare("SELECT creado_por, tarea_padre_id FROM tareas WHERE id = ?");
        $stmt->execute([$currentTaskId]);
        $taskInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$taskInfo) break;
        
        $rootCreatorId = $taskInfo['creado_por'];
        $currentTaskId = $taskInfo['tarea_padre_id'];
    }

    // Obtener los usuarios asignados de la tarea padre
    $stmt = $pdo->prepare("
        SELECT usuario_id FROM tareas_asignados
        WHERE tarea_id = ?
    ");
    $stmt->execute([$parentId]);
    $assignedUsers = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Crear un conjunto de usuarios únicos para asignar
    $usersToAssign = array_unique(array_merge(
        $assignedUsers,
        $rootCreatorId ? [$rootCreatorId] : [], // Añadir el creador de la tarea raíz
        [$userId] // Añadir el creador de esta subtarea
    ));

    // Asignar usuarios a la subtarea
    if (!empty($usersToAssign)) {
        foreach ($usersToAssign as $assignedUserId) {
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO tareas_asignados (tarea_id, usuario_id)
                VALUES (?, ?)
            ");
            $stmt->execute([$taskId, $assignedUserId]);
        }
    }

    // Confirmar la transacción
    $pdo->commit();

    echo json_encode($task);
} catch (Exception $e) {
    // Revertir la transacción en caso de error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['error' => $e->getMessage()]);
}
?>
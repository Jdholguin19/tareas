<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$currentUserId = $_SESSION['user_id'];

// Obtener el ID del usuario cuyas tareas queremos ver
$targetUserId = isset($_GET['userId']) ? intval($_GET['userId']) : $currentUserId;

// Verificar permisos: solo puede ver tareas de otros si es admin, manager, o del mismo departamento
if ($targetUserId !== $currentUserId) {
    // Obtener información del usuario actual
    $stmt = $pdo->prepare("
        SELECT u.rol_id, u.departamento_id, d.manager_id 
        FROM usuarios u
        LEFT JOIN departamentos d ON u.departamento_id = d.id
        WHERE u.id = ?
    ");
    $stmt->execute([$currentUserId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentUser) {
        echo json_encode(['error' => 'Usuario no encontrado']);
        exit;
    }
    
    // Obtener información del usuario objetivo
    $stmt = $pdo->prepare("
        SELECT u.departamento_id
        FROM usuarios u
        WHERE u.id = ?
    ");
    $stmt->execute([$targetUserId]);
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$targetUser) {
        echo json_encode(['error' => 'Usuario objetivo no encontrado']);
        exit;
    }
    
    $isAdmin = intval($currentUser['rol_id']) === 2;
    
    // Verificar si es manager del departamento del usuario objetivo
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as is_manager 
        FROM departamentos d
        JOIN usuarios u ON u.departamento_id = d.id
        WHERE d.manager_id = ? AND u.id = ?
    ");
    $stmt->execute([$currentUserId, $targetUserId]);
    $managerCheck = $stmt->fetch(PDO::FETCH_ASSOC);
    $isManager = intval($managerCheck['is_manager']) > 0;
    
    // Verificar si pertenecen al mismo departamento
    $sameDepartment = ($currentUser['departamento_id'] !== null && 
                       $targetUser['departamento_id'] !== null &&
                       intval($currentUser['departamento_id']) === intval($targetUser['departamento_id']));
    
    // Si no es admin, ni manager del departamento del usuario, ni del mismo departamento, denegar acceso
    if (!$isAdmin && !$isManager && !$sameDepartment) {
        echo json_encode(['error' => 'No tienes permisos para ver las tareas de este usuario']);
        exit;
    }
}

try {
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
            t.tipos_tareas_id AS Tipos_Tareas_ID,
            t.prioridad AS Prioridad,
            t.importancia AS Importancia,
            u.username AS asignado_a_username,
            p.nombre AS proyecto_nombre
        FROM tareas t
        LEFT JOIN usuarios u ON t.asignado_a = u.id
        LEFT JOIN proyectos p ON t.proyecto_id = p.id
        WHERE (t.creado_por = ? OR t.id IN (
            SELECT ta.tarea_id FROM tareas_asignados ta WHERE ta.usuario_id = ?
        ))
        ORDER BY 
            CASE t.prioridad 
                WHEN 'alta' THEN 1 
                WHEN 'media' THEN 2 
                WHEN 'baja' THEN 3 
            END,
            t.fecha_creacion DESC
    ");
    $stmt->execute([$targetUserId, $targetUserId]);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert Adjuntos_URL from JSON string to array and apply auto priority/importance logic
    foreach ($tasks as &$task) {
        $task['Adjuntos_URL'] = json_decode($task['Adjuntos_URL'] ?? '[]', true);
        
        // Aplicar lógica automática de prioridad e importancia
        // Solo si ambos están en 'baja' (no sobrescribir cambios manuales)
        if ($task['Prioridad'] === 'baja' && $task['Importancia'] === 'baja') {
            $fechaVencimiento = $task['Fecha_Vencimiento'];
            
            // Si no tiene fecha de vencimiento, ambos son media
            if (empty($fechaVencimiento)) {
                $task['Prioridad'] = 'media';
                $task['Importancia'] = 'media';
            } else {
                // Calcular días restantes
                $today = new DateTime();
                $today->setTime(0, 0, 0);
                $dueDate = new DateTime($fechaVencimiento);
                $dueDate->setTime(0, 0, 0);
                $interval = $today->diff($dueDate);
                $diffDays = (int)$interval->format('%r%a'); // %r incluye el signo
                
                // Si faltan 7 días o menos (o ya venció), ambos son media
                if ($diffDays <= 7) {
                    $task['Prioridad'] = 'media';
                    $task['Importancia'] = 'media';
                }
            }
        }
    }

    echo json_encode($tasks);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

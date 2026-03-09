<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$currentUserId = $_SESSION['user_id'];

// Obtener el ID del usuario cuyos proyectos queremos ver
$targetUserId = isset($_GET['userId']) ? intval($_GET['userId']) : $currentUserId;

// Verificar permisos: solo puede ver proyectos de otros si es admin, manager, o del mismo departamento
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
        echo json_encode(['error' => 'No tienes permisos para ver los proyectos de este usuario']);
        exit;
    }
}

try {
    // Obtener proyectos donde el usuario tiene tareas (creadas o asignadas)
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            p.id,
            p.nombre
        FROM proyectos p
        WHERE p.id IN (
            SELECT DISTINCT t.proyecto_id 
            FROM tareas t
            WHERE t.creado_por = ? 
            OR t.id IN (
                SELECT ta.tarea_id 
                FROM tareas_asignados ta 
                WHERE ta.usuario_id = ?
            )
        )
        ORDER BY p.nombre
    ");
    $stmt->execute([$targetUserId, $targetUserId]);
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($projects);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

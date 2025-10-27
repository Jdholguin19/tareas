<?php
require_once 'config.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

try {
    // Solo proyectos del usuario (manager) o donde tenga tareas creadas/asignadas
    $stmt = $pdo->prepare(
        "SELECT DISTINCT p.id, p.nombre
         FROM proyectos p
         LEFT JOIN tareas t ON t.proyecto_id = p.id
         LEFT JOIN tareas_asignados ta ON ta.tarea_id = t.id
         WHERE p.manager_id = ?
            OR t.creado_por = ?
            OR t.asignado_a = ?
            OR ta.usuario_id = ?
         ORDER BY p.nombre"
    );
    $stmt->execute([$userId, $userId, $userId, $userId]);
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($projects);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
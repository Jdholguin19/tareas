<?php
require_once 'config.php';

try {
    // Verificar que el usuario esté autenticado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }

    // Obtener todos los proyectos con información del manager
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.nombre,
            p.manager_id,
            p.fecha_inicio,
            u.username as manager_name,
            u.email as manager_email,
            COUNT(DISTINCT t.id) as total_tareas
        FROM proyectos p
        LEFT JOIN usuarios u ON p.manager_id = u.id
        LEFT JOIN tareas t ON t.proyecto_id = p.id
        GROUP BY p.id
        ORDER BY p.nombre ASC
    ");
    
    $stmt->execute();
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($projects);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener proyectos: ' . $e->getMessage()]);
}
?>

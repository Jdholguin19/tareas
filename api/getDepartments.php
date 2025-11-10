<?php
require_once 'config.php';

try {
    // Verificar que el usuario esté autenticado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }

    // Obtener todos los departamentos
    $stmt = $pdo->prepare("
        SELECT 
            d.id,
            d.nombre,
            d.manager_id,
            u.username as manager_name
        FROM departamentos d
        LEFT JOIN usuarios u ON d.manager_id = u.id
        ORDER BY d.nombre ASC
    ");
    
    $stmt->execute();
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($departments);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener departamentos: ' . $e->getMessage()]);
}
?>

<?php
require_once 'config.php';

try {
    // Verificar que el usuario esté autenticado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }

    $userId = $_GET['user_id'] ?? null;

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'El ID de usuario es requerido']);
        exit();
    }

    // Obtener todos los departamentos del usuario
    $stmt = $pdo->prepare("
        SELECT d.id, d.nombre
        FROM departamentos d
        INNER JOIN usuario_departamentos ud ON d.id = ud.departamento_id
        WHERE ud.usuario_id = ?
        ORDER BY d.nombre
    ");
    $stmt->execute([$userId]);
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($departments);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener departamentos: ' . $e->getMessage()]);
}
?>

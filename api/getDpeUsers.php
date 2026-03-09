<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $roleStmt = $pdo->prepare("SELECT rol_id FROM usuarios WHERE id = ?");
    $roleStmt->execute([$userId]);
    $role = $roleStmt->fetchColumn();
    if ((int)$role !== 2) {
        http_response_code(403);
        echo json_encode(['error' => 'Acceso denegado']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT DISTINCT u.id, u.username, u.email
        FROM tareas t
        INNER JOIN usuarios u ON u.id = t.creado_por
        WHERE t.tipos_tareas_id = 5
          AND u.estado = 'activo'
        ORDER BY u.username ASC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener usuarios DPE: ' . $e->getMessage()]);
}

<?php
require_once 'config.php';

try {
    // Verificar que el usuario esté autenticado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }

    // Verificar que el usuario sea admin
    $userStmt = $pdo->prepare("SELECT rol_id FROM usuarios WHERE id = ?");
    $userStmt->execute([$_SESSION['user_id']]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['rol_id'] != 2) {
        http_response_code(403);
        echo json_encode(['error' => 'No tienes permisos de administrador']);
        exit();
    }

    // Obtener datos del POST
    $data = json_decode(file_get_contents('php://input'), true);
    $departmentId = $data['id'] ?? null;

    if (!$departmentId) {
        http_response_code(400);
        echo json_encode(['error' => 'El ID del departamento es requerido']);
        exit();
    }

    // Eliminar departamento
    $stmt = $pdo->prepare("DELETE FROM departamentos WHERE id = ?");
    $stmt->execute([$departmentId]);

    echo json_encode(['success' => true, 'message' => 'Departamento eliminado correctamente']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al eliminar departamento: ' . $e->getMessage()]);
}
?>

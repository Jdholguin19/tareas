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
    $nombre = trim($data['nombre'] ?? '');

    if (empty($nombre)) {
        http_response_code(400);
        echo json_encode(['error' => 'El nombre del departamento es requerido']);
        exit();
    }

    // Verificar que no exista un departamento con el mismo nombre
    $checkStmt = $pdo->prepare("SELECT id FROM departamentos WHERE nombre = ?");
    $checkStmt->execute([$nombre]);
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Ya existe un departamento con ese nombre']);
        exit();
    }

    // Crear departamento
    $stmt = $pdo->prepare("INSERT INTO departamentos (nombre) VALUES (?)");
    $stmt->execute([$nombre]);
    
    $newId = $pdo->lastInsertId();

    // Obtener el departamento creado
    $getStmt = $pdo->prepare("SELECT * FROM departamentos WHERE id = ?");
    $getStmt->execute([$newId]);
    $department = $getStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($department);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al crear departamento: ' . $e->getMessage()]);
}
?>

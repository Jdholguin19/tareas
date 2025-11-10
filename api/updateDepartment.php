<?php
require_once 'config.php';

try {
    // Verificar que el usuario esté autenticado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }

    // Verificar que sea admin
    $stmt = $pdo->prepare("SELECT rol_id FROM usuarios WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || $user['rol_id'] != 2) {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado. Se requiere rol de administrador.']);
        exit();
    }

    // Obtener datos del request
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $nombre = $data['nombre'] ?? null;
    $manager_id = $data['manager_id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de departamento requerido']);
        exit();
    }

    if (!$nombre || trim($nombre) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre de departamento requerido']);
        exit();
    }

    // Verificar que el departamento existe
    $stmt = $pdo->prepare("SELECT id FROM departamentos WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Departamento no encontrado']);
        exit();
    }

    // Verificar que no exista otro departamento con el mismo nombre
    $stmt = $pdo->prepare("SELECT id FROM departamentos WHERE nombre = ? AND id != ?");
    $stmt->execute([trim($nombre), $id]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Ya existe un departamento con ese nombre']);
        exit();
    }

    // Si se proporciona manager_id, verificar que el usuario existe
    if ($manager_id !== null && $manager_id !== '') {
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE id = ? AND estado = 'activo'");
        $stmt->execute([$manager_id]);
        if (!$stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Manager no encontrado o inactivo']);
            exit();
        }
    } else {
        $manager_id = null;
    }

    // Actualizar departamento
    $stmt = $pdo->prepare("
        UPDATE departamentos 
        SET nombre = ?, manager_id = ?
        WHERE id = ?
    ");
    $stmt->execute([trim($nombre), $manager_id, $id]);

    // Obtener departamento actualizado con información del manager
    $stmt = $pdo->prepare("
        SELECT 
            d.id,
            d.nombre,
            d.manager_id,
            u.username as manager_name
        FROM departamentos d
        LEFT JOIN usuarios u ON d.manager_id = u.id
        WHERE d.id = ?
    ");
    $stmt->execute([$id]);
    $department = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($department);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al actualizar departamento: ' . $e->getMessage()]);
}
?>

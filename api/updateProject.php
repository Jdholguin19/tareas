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
        echo json_encode(['error' => 'ID de proyecto requerido']);
        exit();
    }

    if (!$nombre || trim($nombre) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre de proyecto requerido']);
        exit();
    }

    // Verificar que el proyecto existe
    $stmt = $pdo->prepare("SELECT id FROM proyectos WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Proyecto no encontrado']);
        exit();
    }

    // Verificar que no exista otro proyecto con el mismo nombre
    $stmt = $pdo->prepare("SELECT id FROM proyectos WHERE nombre = ? AND id != ?");
    $stmt->execute([trim($nombre), $id]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Ya existe un proyecto con ese nombre']);
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

    // Actualizar proyecto
    $stmt = $pdo->prepare("
        UPDATE proyectos 
        SET nombre = ?, manager_id = ?
        WHERE id = ?
    ");
    $stmt->execute([trim($nombre), $manager_id, $id]);

    // Obtener proyecto actualizado con información del manager
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
        WHERE p.id = ?
        GROUP BY p.id
    ");
    $stmt->execute([$id]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($project);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al actualizar proyecto: ' . $e->getMessage()]);
}
?>

<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = isset($data['id']) ? intval($data['id']) : 0;
$nombre = isset($data['nombre']) ? trim($data['nombre']) : '';

if (!$id || $nombre === '') {
    http_response_code(400);
    echo json_encode(['error' => 'ID y nombre requeridos']);
    exit;
}

try {
    // Verificar que el proyecto existe y que el usuario es manager o admin
    $stmt = $pdo->prepare("SELECT manager_id FROM proyectos WHERE id = ?");
    $stmt->execute([$id]);
    $p = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$p) {
        http_response_code(404);
        echo json_encode(['error' => 'Proyecto no encontrado']);
        exit;
    }

    $currentUserId = $_SESSION['user_id'];
    $isAdmin = false;
    $stmt = $pdo->prepare("SELECT rol_id FROM usuarios WHERE id = ?");
    $stmt->execute([$currentUserId]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($u && intval($u['rol_id']) === 2) $isAdmin = true;

    if (!$isAdmin && intval($p['manager_id']) !== intval($currentUserId)) {
        http_response_code(403);
        echo json_encode(['error' => 'No tienes permisos para editar este proyecto']);
        exit;
    }

    // Verificar duplicados para el mismo manager
    $stmt = $pdo->prepare("SELECT id FROM proyectos WHERE nombre = ? AND id != ?");
    $stmt->execute([$nombre, $id]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Ya existe un proyecto con ese nombre']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE proyectos SET nombre = ? WHERE id = ?");
    $stmt->execute([$nombre, $id]);

    // Devolver proyecto actualizado
    $stmt = $pdo->prepare("SELECT p.id, p.nombre, p.manager_id, COUNT(t.id) as total_tareas
        FROM proyectos p
        LEFT JOIN tareas t ON t.proyecto_id = p.id
        WHERE p.id = ?
        GROUP BY p.id");
    $stmt->execute([$id]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($project);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>

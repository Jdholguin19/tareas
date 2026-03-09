<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = isset($data['id']) ? intval($data['id']) : 0;
$force = isset($data['force_delete_tasks']) ? boolval($data['force_delete_tasks']) : false;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de proyecto requerido']);
    exit;
}

try {
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
        echo json_encode(['error' => 'No tienes permisos para eliminar este proyecto']);
        exit;
    }

    // Contar tareas
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM tareas WHERE proyecto_id = ?");
    $stmt->execute([$id]);
    $cnt = intval($stmt->fetchColumn());

    if ($cnt > 0 && !$force) {
        echo json_encode(['error' => 'PROJECT_HAS_TASKS', 'tasks_count' => $cnt]);
        exit;
    }

    // Si force -> eliminar tareas asociadas primero
    if ($cnt > 0 && $force) {
        $stmt = $pdo->prepare("DELETE FROM tareas WHERE proyecto_id = ?");
        $stmt->execute([$id]);
    }

    // Finalmente eliminar proyecto
    $stmt = $pdo->prepare("DELETE FROM proyectos WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>

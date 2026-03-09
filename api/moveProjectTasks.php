<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$from = isset($data['from_project_id']) ? intval($data['from_project_id']) : 0;
$to = isset($data['to_project_id']) ? intval($data['to_project_id']) : 0;

if (!$from || !$to) {
    http_response_code(400);
    echo json_encode(['error' => 'from_project_id y to_project_id requeridos']);
    exit;
}

try {
    // Verificar permisos sobre proyecto origen
    $stmt = $pdo->prepare("SELECT manager_id FROM proyectos WHERE id = ?");
    $stmt->execute([$from]);
    $p = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$p) { http_response_code(404); echo json_encode(['error'=>'Proyecto origen no encontrado']); exit; }

    $currentUserId = $_SESSION['user_id'];
    $isAdmin = false;
    $stmt = $pdo->prepare("SELECT rol_id FROM usuarios WHERE id = ?");
    $stmt->execute([$currentUserId]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($u && intval($u['rol_id']) === 2) $isAdmin = true;

    if (!$isAdmin && intval($p['manager_id']) !== intval($currentUserId)) {
        http_response_code(403);
        echo json_encode(['error' => 'No tienes permisos para mover tareas de este proyecto']);
        exit;
    }

    // Verificar proyecto destino existe
    $stmt = $pdo->prepare("SELECT id FROM proyectos WHERE id = ?");
    $stmt->execute([$to]);
    if (!$stmt->fetch()) { http_response_code(404); echo json_encode(['error'=>'Proyecto destino no encontrado']); exit; }

    $stmt = $pdo->prepare("UPDATE tareas SET proyecto_id = ? WHERE proyecto_id = ?");
    $stmt->execute([$to, $from]);
    $rows = $stmt->rowCount();

    echo json_encode(['moved' => $rows]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>

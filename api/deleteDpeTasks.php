<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $roleStmt = $pdo->prepare("SELECT rol_id FROM usuarios WHERE id = ?");
    $roleStmt->execute([$userId]);
    $role = $roleStmt->fetchColumn();
    if ((int)$role !== 2) {
        echo json_encode(['error' => 'Acceso denegado']);
        exit;
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Error validando permisos']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
$mode = $payload['mode'] ?? 'project';
$projectId = isset($payload['projectId']) ? (int)$payload['projectId'] : null;
$targetUserId = isset($payload['userId']) ? (int)$payload['userId'] : null;

try {
    $where = "t.tipos_tareas_id = 5";
    $params = [];

    if ($mode === 'project') {
        if (!$projectId) {
            echo json_encode(['error' => 'Proyecto requerido']);
            exit;
        }
        $where .= " AND t.proyecto_id = ?";
        $params[] = $projectId;
    } elseif ($mode === 'user') {
        if (!$targetUserId) {
            echo json_encode(['error' => 'Usuario requerido']);
            exit;
        }
        $where .= " AND t.creado_por = ?";
        $params[] = $targetUserId;
    } elseif ($mode !== 'global') {
        echo json_encode(['error' => 'Modo inválido']);
        exit;
    }

    $pdo->beginTransaction();
    $deleteAssign = $pdo->prepare("DELETE ta FROM tareas_asignados ta INNER JOIN tareas t ON ta.tarea_id = t.id WHERE {$where}");
    $deleteAssign->execute($params);

    $taskWhere = str_replace('t.', '', $where);
    $deleteTasks = $pdo->prepare("DELETE FROM tareas WHERE {$taskWhere}");
    $deleteTasks->execute($params);
    $deleted = $deleteTasks->rowCount();
    $pdo->commit();

    echo json_encode(['deleted' => $deleted]);
    exit;

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['error' => $e->getMessage()]);
}

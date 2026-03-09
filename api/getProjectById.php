<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$projectId = isset($_GET['projectId']) ? intval($_GET['projectId']) : 0;
if (!$projectId) {
    echo json_encode(['error' => 'projectId requerido']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT p.id, p.nombre, p.manager_id, COUNT(t.id) as total_tareas
        FROM proyectos p
        LEFT JOIN tareas t ON t.proyecto_id = p.id
        WHERE p.id = ?
        GROUP BY p.id");
    $stmt->execute([$projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$project) {
        echo json_encode(['error' => 'Proyecto no encontrado']);
        exit;
    }
    echo json_encode($project);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

?>

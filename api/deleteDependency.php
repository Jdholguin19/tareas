<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

// Verificar que sea una petición DELETE o POST
if (!in_array($_SERVER['REQUEST_METHOD'], ['DELETE', 'POST'])) {
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$userId = $_SESSION['user_id'];

// Obtener ID de la dependencia
$dependencyId = null;

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Para DELETE, el ID puede venir en la URL
    $dependencyId = $_GET['id'] ?? null;
} else {
    // Para POST, el ID viene en el body
    $input = json_decode(file_get_contents('php://input'), true);
    $dependencyId = $input['id'] ?? null;
}

if (!$dependencyId) {
    echo json_encode(['error' => 'ID de dependencia requerido']);
    exit;
}

$dependencyId = (int)$dependencyId;

try {
    // Verificar que la dependencia existe y el usuario tiene permisos
    $stmtVerify = $pdo->prepare("
        SELECT 
            d.id,
            d.tarea_predecesora_id,
            d.tarea_sucesora_id,
            tp.titulo AS tarea_predecesora_titulo,
            ts.titulo AS tarea_sucesora_titulo
        FROM dependencias_tareas d
        INNER JOIN tareas tp ON d.tarea_predecesora_id = tp.id
        INNER JOIN tareas ts ON d.tarea_sucesora_id = ts.id
        WHERE d.id = :dependencyId
        AND (tp.creado_por = :userId OR ts.creado_por = :userId 
             OR tp.asignado_a = :userId OR ts.asignado_a = :userId
             OR EXISTS (
                 SELECT 1 FROM tareas_asignados ta1 
                 WHERE ta1.tarea_id = tp.id AND ta1.usuario_id = :userId
             )
             OR EXISTS (
                 SELECT 1 FROM tareas_asignados ta2 
                 WHERE ta2.tarea_id = ts.id AND ta2.usuario_id = :userId
             ))
    ");
    
    $stmtVerify->bindParam(':dependencyId', $dependencyId, PDO::PARAM_INT);
    $stmtVerify->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmtVerify->execute();
    
    $dependency = $stmtVerify->fetch(PDO::FETCH_ASSOC);
    
    if (!$dependency) {
        echo json_encode(['error' => 'Dependencia no encontrada o sin permisos para eliminarla']);
        exit;
    }
    
    // Eliminar la dependencia
    $stmtDelete = $pdo->prepare("DELETE FROM dependencias_tareas WHERE id = :dependencyId");
    $stmtDelete->bindParam(':dependencyId', $dependencyId, PDO::PARAM_INT);
    $stmtDelete->execute();
    
    if ($stmtDelete->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Dependencia eliminada exitosamente',
            'deleted_dependency' => [
                'id' => (int)$dependency['id'],
                'tarea_predecesora_id' => (int)$dependency['tarea_predecesora_id'],
                'tarea_sucesora_id' => (int)$dependency['tarea_sucesora_id'],
                'tarea_predecesora_titulo' => $dependency['tarea_predecesora_titulo'],
                'tarea_sucesora_titulo' => $dependency['tarea_sucesora_titulo']
            ]
        ]);
    } else {
        echo json_encode(['error' => 'No se pudo eliminar la dependencia']);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'error' => 'Error al eliminar dependencia: ' . $e->getMessage()
    ]);
}
?>
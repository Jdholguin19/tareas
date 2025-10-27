<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$userId = $_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true);

// Validar datos requeridos
if (!isset($input['tarea_predecesora_id']) || !isset($input['tarea_sucesora_id'])) {
    echo json_encode(['error' => 'Faltan datos requeridos: tarea_predecesora_id y tarea_sucesora_id']);
    exit;
}

$tareaPredecesora = (int)$input['tarea_predecesora_id'];
$tareaSucesora = (int)$input['tarea_sucesora_id'];
$tipoDependencia = $input['tipo_dependencia'] ?? 'FS';
$retrasoDias = (int)($input['retraso_dias'] ?? 0);
$descripcion = $input['descripcion'] ?? null;

// Validar que las tareas no sean la misma
if ($tareaPredecesora === $tareaSucesora) {
    echo json_encode(['error' => 'Una tarea no puede depender de sí misma']);
    exit;
}

// Validar tipo de dependencia
$tiposValidos = ['FS', 'SS', 'FF', 'SF'];
if (!in_array($tipoDependencia, $tiposValidos)) {
    echo json_encode(['error' => 'Tipo de dependencia no válido']);
    exit;
}

try {
    // Verificar que ambas tareas existen y el usuario tiene permisos
    $stmtVerify = $pdo->prepare("
        SELECT COUNT(*) as count FROM tareas t
        WHERE t.id IN (:tarea1, :tarea2)
        AND (t.creado_por = :userId OR t.asignado_a = :userId 
             OR EXISTS (
                 SELECT 1 FROM tareas_asignados ta 
                 WHERE ta.tarea_id = t.id AND ta.usuario_id = :userId
             ))
    ");
    
    $stmtVerify->bindParam(':tarea1', $tareaPredecesora, PDO::PARAM_INT);
    $stmtVerify->bindParam(':tarea2', $tareaSucesora, PDO::PARAM_INT);
    $stmtVerify->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmtVerify->execute();
    
    $result = $stmtVerify->fetch(PDO::FETCH_ASSOC);
    if ($result['count'] < 2) {
        echo json_encode(['error' => 'No tienes permisos para crear dependencias entre estas tareas']);
        exit;
    }
    
    // Verificar que no exista ya esta dependencia
    $stmtExists = $pdo->prepare("
        SELECT COUNT(*) as count FROM dependencias_tareas 
        WHERE tarea_predecesora_id = :predecesora AND tarea_sucesora_id = :sucesora AND tipo_dependencia = :tipo
    ");
    
    $stmtExists->bindParam(':predecesora', $tareaPredecesora, PDO::PARAM_INT);
    $stmtExists->bindParam(':sucesora', $tareaSucesora, PDO::PARAM_INT);
    $stmtExists->bindParam(':tipo', $tipoDependencia, PDO::PARAM_STR);
    $stmtExists->execute();
    
    $exists = $stmtExists->fetch(PDO::FETCH_ASSOC);
    if ($exists['count'] > 0) {
        echo json_encode(['error' => 'Ya existe una dependencia de este tipo entre estas tareas']);
        exit;
    }
    
    // Función recursiva para detectar ciclos
    function detectarCiclo($pdo, $tareaInicio, $tareaFin, $visitadas = []) {
        if ($tareaInicio === $tareaFin) {
            return true; // Ciclo detectado
        }
        
        if (in_array($tareaInicio, $visitadas)) {
            return false; // Ya visitada, no hay ciclo en esta rama
        }
        
        $visitadas[] = $tareaInicio;
        
        // Buscar todas las tareas que dependen de la tarea actual
        $stmt = $pdo->prepare("
            SELECT tarea_sucesora_id FROM dependencias_tareas 
            WHERE tarea_predecesora_id = :tarea_id
        ");
        $stmt->bindParam(':tarea_id', $tareaInicio, PDO::PARAM_INT);
        $stmt->execute();
        
        $dependientes = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($dependientes as $dependiente) {
            if (detectarCiclo($pdo, $dependiente, $tareaFin, $visitadas)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Verificar que no se cree un ciclo
    if (detectarCiclo($pdo, $tareaSucesora, $tareaPredecesora)) {
        echo json_encode(['error' => 'Esta dependencia crearía un ciclo infinito']);
        exit;
    }
    
    // Crear la dependencia
    $stmt = $pdo->prepare("
        INSERT INTO dependencias_tareas 
        (tarea_predecesora_id, tarea_sucesora_id, tipo_dependencia, retraso_dias, descripcion)
        VALUES (:predecesora, :sucesora, :tipo, :retraso, :descripcion)
    ");
    
    $stmt->bindParam(':predecesora', $tareaPredecesora, PDO::PARAM_INT);
    $stmt->bindParam(':sucesora', $tareaSucesora, PDO::PARAM_INT);
    $stmt->bindParam(':tipo', $tipoDependencia, PDO::PARAM_STR);
    $stmt->bindParam(':retraso', $retrasoDias, PDO::PARAM_INT);
    $stmt->bindParam(':descripcion', $descripcion, PDO::PARAM_STR);
    
    $stmt->execute();
    
    $dependencyId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Dependencia creada exitosamente',
        'dependency_id' => (int)$dependencyId,
        'data' => [
            'id' => (int)$dependencyId,
            'tarea_predecesora_id' => $tareaPredecesora,
            'tarea_sucesora_id' => $tareaSucesora,
            'tipo_dependencia' => $tipoDependencia,
            'retraso_dias' => $retrasoDias,
            'descripcion' => $descripcion
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'error' => 'Error al crear dependencia: ' . $e->getMessage()
    ]);
}
?>
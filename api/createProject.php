<?php
require_once 'config.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$nombre = trim($input['nombre'] ?? '');
$userId = (int)$_SESSION['user_id'];

if ($nombre === '') {
    echo json_encode(['error' => 'Nombre de proyecto requerido']);
    exit;
}

try {
    // Evitar duplicados (por nombre)
    $stmtCheck = $pdo->prepare("SELECT id, manager_id FROM proyectos WHERE nombre = ?");
    $stmtCheck->execute([$nombre]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        // Si el proyecto existente pertenece al mismo manager, devolverlo; de lo contrario, error
        if ((int)$existing['manager_id'] === $userId) {
            echo json_encode(['id' => (int)$existing['id'], 'nombre' => $nombre]);
        } else {
            echo json_encode(['error' => 'El nombre del proyecto ya está en uso por otro usuario']);
        }
        exit;
    }

    // Crear proyecto con manager_id = usuario actual
    $stmt = $pdo->prepare("INSERT INTO proyectos (nombre, manager_id) VALUES (?, ?)");
    $stmt->execute([$nombre, $userId]);
    $id = $pdo->lastInsertId();

    echo json_encode(['id' => (int)$id, 'nombre' => $nombre]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
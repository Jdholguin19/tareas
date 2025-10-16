<?php
require_once 'config.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$nombre = trim($input['nombre'] ?? '');

if ($nombre === '') {
    echo json_encode(['error' => 'Nombre de proyecto requerido']);
    exit;
}

try {
    // Evitar duplicados (por nombre)
    $stmtCheck = $pdo->prepare("SELECT id FROM proyectos WHERE nombre = ?");
    $stmtCheck->execute([$nombre]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        // Return existing project
        echo json_encode(['id' => (int)$existing['id'], 'nombre' => $nombre]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO proyectos (nombre) VALUES (?)");
    $stmt->execute([$nombre]);
    $id = $pdo->lastInsertId();

    echo json_encode(['id' => (int)$id, 'nombre' => $nombre]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
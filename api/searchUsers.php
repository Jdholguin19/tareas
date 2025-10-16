<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$query = $_GET['q'] ?? '';

if (strlen($query) < 1) {
    echo json_encode([]);
    exit;
}

try {
    // Buscar usuarios por nombre de usuario o email que contengan la query
    $stmt = $pdo->prepare("
        SELECT id, username, email
        FROM usuarios
        WHERE (username LIKE ? OR email LIKE ?) AND estado = 'activo'
        ORDER BY username
        LIMIT 10
    ");
    $searchTerm = '%' . $query . '%';
    $stmt->execute([$searchTerm, $searchTerm]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
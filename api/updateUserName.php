<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$name = isset($data['name']) ? trim($data['name']) : '';
if ($name === '') { http_response_code(400); echo json_encode(['error' => 'Nombre requerido']); exit; }

try {
    $stmt = $pdo->prepare("UPDATE usuarios SET username = ? WHERE id = ?");
    $stmt->execute([$name, $_SESSION['user_id']]);
    $stmt = $pdo->prepare("SELECT id, username, email FROM usuarios WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($u);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>

<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'result' => $result]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT id, nombre FROM proyectos ORDER BY nombre");
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($projects);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
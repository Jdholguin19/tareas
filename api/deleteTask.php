<?php
require_once 'config.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(['error' => 'Task ID is required']);
    exit;
}

try {
    // Check if task exists
    $stmtCheck = $pdo->prepare("SELECT id FROM tareas WHERE id = ?");
    $stmtCheck->execute([$id]);
    $task = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        echo json_encode(['error' => 'Task not found']);
        exit;
    }

    // Delete the task
    $stmt = $pdo->prepare("DELETE FROM tareas WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
    } else {
        echo json_encode(['error' => 'Failed to delete task']);
    }

} catch (Exception $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
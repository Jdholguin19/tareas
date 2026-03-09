<?php
// Adjusted includes: db.php and db_users.php are located in api/metrics/
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/sync_planics.php';
require_once __DIR__ . '/../db_users.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['planics_task_id'])) {
    echo json_encode(['ok' => false, 'message' => 'planics_task_id required']);
    exit;
}

$planicsTaskId = intval($_GET['planics_task_id']);

try {
    $metricsDb = DB::getDB();
    $planicsDb = DBUsers::getDB();

    $res = sync_planics_task_completion_to_metrics($metricsDb, $planicsDb, $planicsTaskId);
    echo json_encode($res);
} catch (Throwable $e) {
    error_log('sync_from_planics error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}

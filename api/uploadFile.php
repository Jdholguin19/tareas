<?php
require_once 'config.php';

// Simulate file upload
$url = '/uploads/' . time() . '_file';
echo json_encode(['url' => $url]);
?>
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Database configuration
$host = getenv('DB_HOST') ?: 'box5500.bluehost.com';
$user = getenv('DB_USER') ?: 'portalao_jholguin';
$password = getenv('DB_PASSWORD') ?: 'jofCTV321!*';
$database = getenv('DB_DATABASE') ?: 'portalao_ReunionesCS';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
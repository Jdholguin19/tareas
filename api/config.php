<?php
// API common config
// Allow CORS for the dev setup but enable credentials so sessions (cookies) work.
// We set the Access-Control-Allow-Origin dynamically to the request origin when present.
header('Content-Type: application/json');
// Use the incoming Origin header if present (avoid wildcard when credentials are used)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight response for CORS
    http_response_code(200);
    exit(0);
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Database configuration (keeps current env/defaults)
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

// Ensure session cookie params are set reasonably for local dev
if (session_status() === PHP_SESSION_NONE) {
    // samesite is left as Lax by default to avoid some cross-site restrictions in browsers during dev
    session_start();
}
?>
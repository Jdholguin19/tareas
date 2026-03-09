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

// Load .env file if it exists
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Set as environment variable if not already set
            if (!getenv($key)) {
                putenv("$key=$value");
            }
        }
    }
}

// Database configuration (keeps current env/defaults box5500.bluehost.com )
$host = getenv('DB_HOST') ?: 'localhost';
$user = getenv('DB_USER') ?: 'portalao_jholguin';
$password = getenv('DB_PASSWORD') ?: 'jofCTV321!*';
$database = getenv('DB_DATABASE') ?: 'portalao_ReunionesCS';

// Opciones de PDO: 
// 1. Forzar manejo de errores con excepciones.
$timezone = getenv('DB_TIMEZONE') ?: '-05:00'; // Lee la nueva variable del .env

// 2. Ejecutar comando SET time_zone = '-05:00' (Ecuador) al conectar.
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '{$timezone}'" // Usa la variable
];

try {
    // Usamos las opciones en la función new PDO
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8", $user, $password, $options);
    $pdo->exec("SET time_zone = '-05:00';");
    
    // Ya no es necesario $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // porque está incluido en $options.

} catch (PDOException $e) {
    // Manejo de errores de conexión...
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
    exit();
}

// Configurar duración de sesión (configurable via .env SESSION_LIFETIME en segundos)
if (session_status() === PHP_SESSION_NONE) {
    $defaultLifetime = getenv('SESSION_LIFETIME') ? intval(getenv('SESSION_LIFETIME')) : 2592000; // 30 días por defecto

    // Asegurar un path de sesiones local y writable para evitar problemas de permisos en el path del sistema
    $localSessionPath = __DIR__ . '/../session_data';
    if (!is_dir($localSessionPath)) {
        @mkdir($localSessionPath, 0700, true);
    }

    if (is_dir($localSessionPath) && is_writable($localSessionPath)) {
        ini_set('session.save_path', $localSessionPath);
    }

    // GC settings y lifetime
    ini_set('session.gc_maxlifetime', (string)$defaultLifetime);
    ini_set('session.gc_probability', '1');
    ini_set('session.gc_divisor', '100');

    // Configurar cookie de sesión para que dure SESSION_LIFETIME
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    session_set_cookie_params([
        'lifetime' => $defaultLifetime,
        'path' => '/',
        'domain' => '',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    session_start();
}
?>
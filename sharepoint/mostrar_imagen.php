<?php
// CONFIGURACIÓN
require_once __DIR__ . '/../config/db.php';
$envFile = __DIR__ . '/../config/env_sharepoint.php';
if (is_readable($envFile)) {
    require_once $envFile;
}
$db = DB::getDB();

// Credenciales de Azure AD desde variables de entorno (NUNCA hardcodear)
$tenantId    = getenv('AZURE_TENANT_ID');
$clientId    = getenv('AZURE_CLIENT_ID');
$clientSecret= getenv('AZURE_CLIENT_SECRET');
$domain      = getenv('SHAREPOINT_DOMAIN'); // ej: constv-my.sharepoint.com
$user        = getenv('SHAREPOINT_USER');    // ej: aburgos_thaliavictoria_com_ec

if (!$tenantId || !$clientId || !$clientSecret || !$domain || !$user) {
    http_response_code(500);
    die('❌ Configuración de SharePoint incompleta.');
}

function getAccessToken($tenantId, $clientId, $clientSecret) {
    $url = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token";
    $data = http_build_query([
        'client_id' => $clientId,
        'scope' => 'https://graph.microsoft.com/.default',
        'client_secret' => $clientSecret,
        'grant_type' => 'client_credentials'
    ]);
    $opts = ['http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => $data
    ]];
    $res = file_get_contents($url, false, stream_context_create($opts));
    return json_decode($res, true)['access_token'] ?? die("❌ Error obteniendo token");
}

function getSiteId($accessToken, $domain, $user) {
    // Validar parámetros básicos
    if (!preg_match('/^[A-Za-z0-9._-]+$/', $domain) || !preg_match('/^[A-Za-z0-9._-]+$/', $user)) {
        die('❌ Parámetros inválidos para dominio o usuario.');
    }
    $url = "https://graph.microsoft.com/v1.0/sites/$domain:/personal/$user:";
    $opts = ['http' => [
        'method' => 'GET',
        'header' => "Authorization: Bearer $accessToken"
    ]];
    $res = file_get_contents($url, false, stream_context_create($opts));
    return json_decode($res, true)['id'] ?? die("❌ Error obteniendo siteId");
}

function obtenerUrlTemporal($accessToken, $siteId, $driveItemId) {
    // Validar que driveItemId sea seguro (evitar traversal/SSRF)
    if (!preg_match('/^[A-Za-z0-9._!-]+$/', $driveItemId)) {
        die('❌ drive_item_id inválido.');
    }
    $url = "https://graph.microsoft.com/v1.0/sites/$siteId/drive/items/$driveItemId";
    $opts = ['http' => [
        'method' => 'GET',
        'header' => "Authorization: Bearer $accessToken"
    ]];
    $res = file_get_contents($url, false, stream_context_create($opts));
    $data = json_decode($res, true);
    return $data['@microsoft.graph.downloadUrl'] ?? die("❌ No se pudo obtener la URL temporal de descarga");
}

// Leer el ID
$id = $_GET['id'] ?? null;

if (!$id) {
    die("❌ No se proporcionó ID de imagen.");
}

// Leer drive_item_id de la BD
$stmt = $db->prepare("SELECT drive_item_id FROM progreso_construccion WHERE id = :id");
$stmt->execute([':id' => $id]);
$row = $stmt->fetch();

if (!$row) {
    die("❌ No existe imagen para este ID.");
}

$driveItemId = $row['drive_item_id'] ?? '';
if (!$driveItemId) {
    die("❌ El registro no tiene drive_item_id.");
}

// Ahora obtener la imagen
$token = getAccessToken($tenantId, $clientId, $clientSecret);
$siteId = getSiteId($token, $domain, $user);
$urlImagen = obtenerUrlTemporal($token, $siteId, $driveItemId);

// Validar URL de descarga contra el dominio permitido
if (!filter_var($urlImagen, FILTER_VALIDATE_URL)) {
    die('❌ URL de imagen inválida.');
}
$parts = parse_url($urlImagen);
if (($parts['scheme'] ?? '') !== 'https') {
    die('❌ URL de imagen no segura.');
}
// La URL de descarga suele estar en el dominio de SharePoint del tenant
$host = $parts['host'] ?? '';
if (!$host || (strpos($host, $domain) === false && strpos($host, '.sharepoint.com') === false)) {
    die('❌ Dominio de descarga no permitido.');
}

// Leer la imagen y devolverla
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "Authorization: Bearer $token"
    ]
];
$imgData = file_get_contents($urlImagen, false, stream_context_create($opts));
if ($imgData === false) {
    http_response_code(502);
    die('❌ No se pudo descargar la imagen desde SharePoint.');
}

// Devolverla al navegador
header("Content-Type: image/jpeg"); // Cambia si soportas otros formatos
echo $imgData;

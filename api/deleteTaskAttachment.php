<?php
/**
 * API para eliminar un adjunto de una tarea
 * 
 * Elimina el archivo de SharePoint y la referencia de la base de datos.
 * 
 * Método: DELETE o POST
 * Parámetros:
 *   - attachment_id: ID del adjunto a eliminar
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config/env_sharepoint.php';

header('Content-Type: application/json');

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// Obtener parámetros
$input = json_decode(file_get_contents('php://input'), true);
$attachmentId = isset($input['attachment_id']) ? intval($input['attachment_id']) : 0;

// También permitir por POST tradicional
if (!$attachmentId && isset($_POST['attachment_id'])) {
    $attachmentId = intval($_POST['attachment_id']);
}

if (!$attachmentId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de adjunto requerido']);
    exit;
}

try {
    // Obtener información del adjunto
    $stmt = $pdo->prepare("
        SELECT ta.*, t.creado_por as tarea_creador_id
        FROM tarea_adjuntos ta
        INNER JOIN tareas t ON ta.tarea_id = t.id
        WHERE ta.id = ?
    ");
    $stmt->execute([$attachmentId]);
    $adjunto = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$adjunto) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Adjunto no encontrado']);
        exit;
    }
    
    // Verificar permisos: solo el que lo subió o el creador de la tarea pueden eliminarlo
    if ($adjunto['subido_por'] != $userId && $adjunto['tarea_creador_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No tienes permisos para eliminar este adjunto']);
        exit;
    }
    
    // Obtener credenciales de SharePoint
    $tenantId = defined('SHAREPOINT_TENANT_ID') ? SHAREPOINT_TENANT_ID : getenv('AZURE_TENANT_ID');
    $clientId = defined('SHAREPOINT_CLIENT_ID') ? SHAREPOINT_CLIENT_ID : getenv('AZURE_CLIENT_ID');
    $clientSecret = defined('SHAREPOINT_CLIENT_SECRET') ? SHAREPOINT_CLIENT_SECRET : getenv('AZURE_CLIENT_SECRET');
    $domain = getenv('SHAREPOINT_DOMAIN') ?: 'constv.sharepoint.com';
    
    if (!$tenantId || !$clientId || !$clientSecret || !$domain) {
        throw new Exception('Configuración de SharePoint incompleta');
    }
    
    // Obtener token de acceso
    $accessToken = getAccessToken($tenantId, $clientId, $clientSecret);
    $siteId = getSiteId($accessToken, $domain);
    
    // Eliminar archivo de SharePoint
    try {
        deleteFileFromSharePoint($accessToken, $siteId, $adjunto['drive_item_id']);
    } catch (Exception $e) {
        // Si falla eliminar de SharePoint, registrar pero continuar
        error_log('Error al eliminar archivo de SharePoint: ' . $e->getMessage());
    }
    
    // Eliminar registro de la base de datos
    $stmt = $pdo->prepare("DELETE FROM tarea_adjuntos WHERE id = ?");
    $stmt->execute([$attachmentId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Adjunto eliminado correctamente'
    ]);
    
} catch (Exception $e) {
    error_log('Error al eliminar adjunto: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al eliminar adjunto: ' . $e->getMessage()
    ]);
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

function getAccessToken($tenantId, $clientId, $clientSecret) {
    $url = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token";
    $data = http_build_query([
        'client_id' => $clientId,
        'scope' => 'https://graph.microsoft.com/.default',
        'client_secret' => $clientSecret,
        'grant_type' => 'client_credentials'
    ]);
    
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $data,
            'timeout' => 30
        ]
    ];
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new Exception('Error al obtener token de acceso de Azure AD');
    }
    
    $result = json_decode($response, true);
    
    if (!isset($result['access_token'])) {
        throw new Exception('No se pudo obtener el token de acceso');
    }
    
    return $result['access_token'];
}

function getSiteId($accessToken, $domain) {
    $url = "https://graph.microsoft.com/v1.0/sites/$domain";
    
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Authorization: Bearer $accessToken",
            'timeout' => 30
        ]
    ];
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new Exception('Error al obtener site ID de SharePoint');
    }
    
    $result = json_decode($response, true);
    
    if (!isset($result['id'])) {
        throw new Exception('No se pudo obtener el site ID');
    }
    
    return $result['id'];
}

function deleteFileFromSharePoint($accessToken, $siteId, $driveItemId) {
    // Validar drive_item_id
    if (!preg_match('/^[A-Za-z0-9._!-]+$/', $driveItemId)) {
        throw new Exception('ID de archivo inválido');
    }
    
    $url = "https://graph.microsoft.com/v1.0/sites/$siteId/drive/items/$driveItemId";
    
    $opts = [
        'http' => [
            'method' => 'DELETE',
            'header' => "Authorization: Bearer $accessToken",
            'timeout' => 30,
            'ignore_errors' => true // Para capturar el código de respuesta
        ]
    ];
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    
    // Verificar código de respuesta HTTP
    $httpCode = 0;
    if (isset($http_response_header[0])) {
        preg_match('/HTTP\/\d\.\d\s+(\d+)/', $http_response_header[0], $matches);
        $httpCode = intval($matches[1] ?? 0);
    }
    
    // 204 = eliminado correctamente, 404 = ya no existe (también OK)
    if ($httpCode !== 204 && $httpCode !== 404) {
        throw new Exception('Error al eliminar archivo de SharePoint (código: ' . $httpCode . ')');
    }
    
    return true;
}
?>

<?php
/**
 * API para obtener adjuntos de una tarea
 * 
 * Devuelve la lista de archivos adjuntos de una tarea con URLs temporales
 * para descargar desde SharePoint.
 * 
 * Método: GET
 * Parámetros:
 *   - tarea_id: ID de la tarea
 * 
 * Respuesta JSON:
 *   {
 *     "success": true,
 *     "attachments": [
 *       {
 *         "id": 123,
 *         "nombre_archivo": "imagen.jpg",
 *         "tipo_archivo": "imagen",
 *         "extension": "jpg",
 *         "tamano_bytes": 51200,
 *         "fecha_subida": "2025-12-09 10:30:00",
 *         "subido_por": {"id": 1, "username": "usuario"},
 *         "url_descarga": "https://..."
 *       }
 *     ]
 *   }
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

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// Obtener parámetro
$tareaId = isset($_GET['tarea_id']) ? intval($_GET['tarea_id']) : 0;

if (!$tareaId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de tarea requerido']);
    exit;
}

try {
    // Obtener adjuntos de la base de datos
    $stmt = $pdo->prepare("
        SELECT 
            ta.id,
            ta.drive_item_id,
            ta.nombre_archivo,
            ta.tipo_archivo,
            ta.extension,
            ta.tamano_bytes,
            ta.mime_type,
            ta.fecha_subida,
            ta.subido_por,
            u.username as subido_por_username
        FROM tarea_adjuntos ta
        LEFT JOIN usuarios u ON ta.subido_por = u.id
        WHERE ta.tarea_id = ?
        ORDER BY ta.fecha_subida DESC
    ");
    
    $stmt->execute([$tareaId]);
    $adjuntos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($adjuntos)) {
        echo json_encode([
            'success' => true,
            'attachments' => []
        ]);
        exit;
    }
    
    // Obtener credenciales de SharePoint
    $tenantId = getenv('AZURE_TENANT_ID');
    $clientId = getenv('AZURE_CLIENT_ID');
    $clientSecret = getenv('AZURE_CLIENT_SECRET');
    $domain = getenv('SHAREPOINT_DOMAIN');
    $documentLibrary = getenv('SHAREPOINT_DOCUMENT_LIBRARY');
    
    if (!$tenantId || !$clientId || !$clientSecret || !$domain || !$documentLibrary) {
        throw new Exception('Configuración de SharePoint incompleta');
    }
    
    // Obtener token de acceso (una sola vez para todos los archivos)
    $accessToken = getAccessToken($tenantId, $clientId, $clientSecret);
    $siteId = getSiteId($accessToken, $domain);
    $driveId = getDriveIdByName($accessToken, $siteId, $documentLibrary);
    
    // Agregar URLs de descarga temporal a cada adjunto
    $attachmentsWithUrls = [];
    foreach ($adjuntos as $adjunto) {
        try {
            $downloadUrl = getTemporaryDownloadUrl($accessToken, $driveId, $adjunto['drive_item_id']);
            
            $attachmentsWithUrls[] = [
                'id' => intval($adjunto['id']),
                'nombre_archivo' => $adjunto['nombre_archivo'],
                'tipo_archivo' => $adjunto['tipo_archivo'],
                'extension' => $adjunto['extension'],
                'tamano_bytes' => intval($adjunto['tamano_bytes']),
                'tamano_formateado' => formatBytes($adjunto['tamano_bytes']),
                'mime_type' => $adjunto['mime_type'],
                'fecha_subida' => $adjunto['fecha_subida'],
                'subido_por' => [
                    'id' => intval($adjunto['subido_por']),
                    'username' => $adjunto['subido_por_username']
                ],
                'url_descarga' => $downloadUrl
            ];
        } catch (Exception $e) {
            // Si falla obtener la URL de un archivo, lo marcamos pero no lo omitimos
            error_log('Error al obtener URL para adjunto ' . $adjunto['id'] . ': ' . $e->getMessage());
            $attachmentsWithUrls[] = [
                'id' => intval($adjunto['id']),
                'nombre_archivo' => $adjunto['nombre_archivo'],
                'tipo_archivo' => $adjunto['tipo_archivo'],
                'extension' => $adjunto['extension'],
                'tamano_bytes' => intval($adjunto['tamano_bytes']),
                'tamano_formateado' => formatBytes($adjunto['tamano_bytes']),
                'mime_type' => $adjunto['mime_type'],
                'fecha_subida' => $adjunto['fecha_subida'],
                'subido_por' => [
                    'id' => intval($adjunto['subido_por']),
                    'username' => $adjunto['subido_por_username']
                ],
                'url_descarga' => null,
                'error' => 'No se pudo obtener URL de descarga'
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'attachments' => $attachmentsWithUrls
    ]);
    
} catch (Exception $e) {
    error_log('Error al obtener adjuntos: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener adjuntos: ' . $e->getMessage()
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

function getDriveIdByName($accessToken, $siteId, $libraryName) {
    $url = "https://graph.microsoft.com/v1.0/sites/$siteId/drives";
    
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
        throw new Exception('Error al obtener bibliotecas de SharePoint');
    }
    
    $result = json_decode($response, true);
    
    if (!isset($result['value'])) {
        throw new Exception('No se pudieron obtener las bibliotecas');
    }
    
    // Buscar la biblioteca por nombre
    foreach ($result['value'] as $drive) {
        if ($drive['name'] === $libraryName) {
            return $drive['id'];
        }
    }
    
    throw new Exception("No se encontró la biblioteca: $libraryName");
}

function getTemporaryDownloadUrl($accessToken, $driveId, $driveItemId) {
    // Validar drive_item_id para prevenir inyecciones
    if (!preg_match('/^[A-Za-z0-9._!-]+$/', $driveItemId)) {
        throw new Exception('ID de archivo inválido');
    }
    
    $url = "https://graph.microsoft.com/v1.0/drives/$driveId/items/$driveItemId";
    
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
        throw new Exception('Error al obtener información del archivo');
    }
    
    $result = json_decode($response, true);
    
    if (!isset($result['@microsoft.graph.downloadUrl'])) {
        throw new Exception('No se pudo obtener URL de descarga');
    }
    
    // La URL de descarga temporal es válida por ~1 hora
    return $result['@microsoft.graph.downloadUrl'];
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= pow(1024, $pow);
    
    return round($bytes, $precision) . ' ' . $units[$pow];
}
?>

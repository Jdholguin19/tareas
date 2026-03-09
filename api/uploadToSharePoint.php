<?php
/**
 * API para subir archivos adjuntos a SharePoint
 * 
 * Recibe archivos, los sube a SharePoint en carpetas organizadas por tarea,
 * y guarda la referencia (drive_item_id) en la base de datos.
 * 
 * Método: POST multipart/form-data
 * Parámetros:
 *   - tarea_id: ID de la tarea
 *   - file: Archivo a subir
 * 
 * Respuesta JSON:
 *   {
 *     "success": true,
 *     "attachment_id": 123,
 *     "nombre_archivo": "imagen.jpg",
 *     "tipo_archivo": "imagen",
 *     "drive_item_id": "01ABCD..."
 *   }
 */

// Deshabilitar output buffering y errores visibles para asegurar JSON limpio
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config/env_sharepoint.php';

// Limpiar cualquier output previo
ob_clean();

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// Obtener parámetros
$tareaId = isset($_POST['tarea_id']) ? intval($_POST['tarea_id']) : 0;

if (!$tareaId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de tarea requerido']);
    exit;
}

// Verificar que el archivo fue subido
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = 'Error al subir archivo';
    if (isset($_FILES['file']['error'])) {
        switch ($_FILES['file']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg = 'El archivo excede el tamaño máximo permitido';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMsg = 'No se seleccionó ningún archivo';
                break;
        }
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $errorMsg]);
    exit;
}

$file = $_FILES['file'];
$fileName = $file['name'];
$fileSize = $file['size'];
$fileTmpPath = $file['tmp_name'];
$fileMime = mime_content_type($fileTmpPath);

// Validar tamaño de archivo (100 MB)
$maxFileSize = intval(getenv('MAX_FILE_SIZE')) ?: 104857600; // 100 MB por defecto
if ($fileSize > $maxFileSize) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'El archivo excede el tamaño máximo de ' . ($maxFileSize / 1048576) . ' MB'
    ]);
    exit;
}

// Obtener extensión
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Validar extensión
$allowedExtensions = explode(',', getenv('ALLOWED_EXTENSIONS'));
if (!in_array($fileExtension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'Tipo de archivo no permitido. Extensiones válidas: ' . implode(', ', $allowedExtensions)
    ]);
    exit;
}

// Determinar tipo de archivo (imagen o documento)
$allowedImageMimes = explode(',', getenv('ALLOWED_IMAGE_MIMES'));
$tipoArchivo = in_array($fileMime, $allowedImageMimes) ? 'imagen' : 'documento';

// Sanitizar nombre de archivo
$safeFileName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);
$safeFileName = 'tarea_' . $tareaId . '_' . time() . '_' . $safeFileName;

try {
    // Obtener credenciales de SharePoint
    $tenantId = getenv('AZURE_TENANT_ID');
    $clientId = getenv('AZURE_CLIENT_ID');
    $clientSecret = getenv('AZURE_CLIENT_SECRET');
    $domain = getenv('SHAREPOINT_DOMAIN');
    $documentLibrary = getenv('SHAREPOINT_DOCUMENT_LIBRARY');
    $rootPath = getenv('SHAREPOINT_ROOT_PATH');
    
    if (!$tenantId || !$clientId || !$clientSecret || !$domain || !$documentLibrary || !$rootPath) {
        throw new Exception('Configuración de SharePoint incompleta');
    }
    
    // Obtener token de acceso
    $accessToken = getAccessToken($tenantId, $clientId, $clientSecret);
    $siteId = getSiteId($accessToken, $domain);
    
    // Obtener el drive ID de la biblioteca de documentos
    $driveId = getDriveIdByName($accessToken, $siteId, $documentLibrary);
    
    // Crear carpeta para la tarea si no existe (dentro de la ruta especificada)
    $folderPath = $rootPath . '/tarea_' . $tareaId;
    
    // Subir archivo a SharePoint
    $uploadResult = uploadFileToSharePoint($accessToken, $siteId, $driveId, $folderPath, $safeFileName, $fileTmpPath);
    
    // Guardar en base de datos
    $stmt = $pdo->prepare("
        INSERT INTO tarea_adjuntos 
        (tarea_id, drive_item_id, nombre_archivo, tipo_archivo, extension, tamano_bytes, mime_type, subido_por, sharepoint_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $tareaId,
        $uploadResult['id'],
        $fileName, // Nombre original
        $tipoArchivo,
        $fileExtension,
        $fileSize,
        $fileMime,
        $userId,
        $uploadResult['webUrl'] ?? null
    ]);
    
    $attachmentId = $pdo->lastInsertId();
    
    // Log de éxito para debugging
    error_log("Archivo subido exitosamente: tarea_id=$tareaId, attachment_id=$attachmentId, nombre=$fileName");
    
    // Limpiar cualquier output previo antes de enviar JSON
    ob_clean();
    
    echo json_encode([
        'success' => true,
        'attachment_id' => $attachmentId,
        'nombre_archivo' => $fileName,
        'tipo_archivo' => $tipoArchivo,
        'extension' => $fileExtension,
        'tamano_bytes' => $fileSize,
        'drive_item_id' => $uploadResult['id'],
        'sharepoint_url' => $uploadResult['webUrl'] ?? null,
        'download_url' => $uploadResult['downloadUrl'] ?? null
    ]);
    
    ob_end_flush();
    exit;
} catch (Exception $e) {
    error_log('Error al subir archivo a SharePoint: ' . $e->getMessage());
    
    // Limpiar cualquier output previo antes de enviar JSON de error
    ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al subir archivo: ' . $e->getMessage()
    ]);
    
    ob_end_flush();
    exit;
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
    // Para sitios de SharePoint (sitio raíz)
    $url = "https://graph.microsoft.com/v1.0/sites/$domain";
    
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Authorization: Bearer $accessToken",
            'timeout' => 30,
            'ignore_errors' => true
        ]
    ];
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new Exception('Error al obtener site ID de SharePoint');
    }
    
    $result = json_decode($response, true);
    
    if (!isset($result['id'])) {
        error_log('Error al obtener site ID: ' . print_r($result, true));
        throw new Exception('No se pudo obtener el site ID: ' . ($result['error']['message'] ?? 'Error desconocido'));
    }
    
    return $result['id'];
}

function getDriveIdByName($accessToken, $siteId, $libraryName) {
    // Obtener todas las bibliotecas del sitio
    $url = "https://graph.microsoft.com/v1.0/sites/$siteId/drives";
    
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Authorization: Bearer $accessToken",
            'timeout' => 30,
            'ignore_errors' => true
        ]
    ];
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new Exception('Error al obtener drives del sitio');
    }
    
    $result = json_decode($response, true);
    
    if (!isset($result['value'])) {
        throw new Exception('No se pudieron obtener los drives');
    }
    
    // Buscar el drive por nombre
    foreach ($result['value'] as $drive) {
        if ($drive['name'] === $libraryName) {
            return $drive['id'];
        }
    }
    
    throw new Exception("No se encontró la biblioteca de documentos: $libraryName");
}

function uploadFileToSharePoint($accessToken, $siteId, $driveId, $folderPath, $fileName, $filePath) {
    // La ruta completa dentro de la biblioteca
    // Ejemplo: 09. IT/Desarrollo/Adjuntos_PlaniCS/tarea_123/archivo.jpg
    
    // Codificar la ruta completa
    $pathParts = explode('/', $folderPath);
    $encodedPath = implode('/', array_map('rawurlencode', $pathParts));
    $encodedFileName = rawurlencode($fileName);
    
    // URL para subir el archivo usando el drive específico
    $url = "https://graph.microsoft.com/v1.0/drives/$driveId/root:/$encodedPath/$encodedFileName:/content";
    
    // Leer contenido del archivo
    $fileContent = file_get_contents($filePath);
    
    if ($fileContent === false) {
        throw new Exception('No se pudo leer el archivo temporal');
    }
    
    // Configurar la petición
    $opts = [
        'http' => [
            'method' => 'PUT',
            'header' => [
                "Authorization: Bearer $accessToken",
                "Content-Type: application/octet-stream"
            ],
            'content' => $fileContent,
            'timeout' => 120, // 2 minutos para archivos grandes
            'ignore_errors' => true
        ]
    ];
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        error_log('Error al subir archivo a SharePoint. URL: ' . $url);
        throw new Exception('Error al subir archivo a SharePoint');
    }
    
    $result = json_decode($response, true);
    
    if (!isset($result['id'])) {
        error_log('Error en respuesta de SharePoint: ' . print_r($result, true));
        throw new Exception('No se pudo obtener el ID del archivo subido: ' . ($result['error']['message'] ?? 'Error desconocido'));
    }
    
    // Retornar información completa del archivo
    return [
        'id' => $result['id'], // drive_item_id
        'webUrl' => $result['webUrl'] ?? '', // URL para ver en SharePoint
        'downloadUrl' => $result['@microsoft.graph.downloadUrl'] ?? '' // URL de descarga directa
    ];
}
?>

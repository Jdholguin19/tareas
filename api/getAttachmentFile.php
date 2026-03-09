<?php
/**
 * API para obtener el contenido de un archivo adjunto desde SharePoint
 * Este endpoint actúa como proxy autenticado
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config/env_sharepoint.php';

// Validar sesión
error_log("getAttachmentFile - Session check - user_id: " . ($_SESSION['user_id'] ?? 'NOT SET'));

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

// Obtener ID del adjunto
$attachmentId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$attachmentId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de adjunto requerido']);
    exit;
}

try {
    // Obtener información del adjunto desde la base de datos
    $stmt = $pdo->prepare("
        SELECT ta.*, t.creado_por AS Usuario_ID 
        FROM tarea_adjuntos ta
        INNER JOIN tareas t ON ta.tarea_id = t.id
        WHERE ta.id = ?
    ");
    $stmt->execute([$attachmentId]);
    $attachment = $stmt->fetch(PDO::FETCH_ASSOC);

    error_log("getAttachmentFile - ID: $attachmentId, Found: " . ($attachment ? 'YES' : 'NO'));
    
    if (!$attachment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Adjunto no encontrado']);
        exit;
    }

    error_log("getAttachmentFile - Attachment data: " . json_encode($attachment));

    // Cachear token en sesión para mejor rendimiento
    $cacheKey = 'sp_token_' . SHAREPOINT_CLIENT_ID;
    $cachedToken = $_SESSION[$cacheKey] ?? null;
    $tokenExpiry = $_SESSION[$cacheKey . '_exp'] ?? 0;
    
    if ($cachedToken && time() < $tokenExpiry) {
        $accessToken = $cachedToken;
        error_log("getAttachmentFile - Token en caché");
    } else {
        // Obtener access token de SharePoint
        $tokenUrl = "https://login.microsoftonline.com/" . SHAREPOINT_TENANT_ID . "/oauth2/v2.0/token";
        $tokenData = [
            'client_id' => SHAREPOINT_CLIENT_ID,
            'client_secret' => SHAREPOINT_CLIENT_SECRET,
            'scope' => 'https://graph.microsoft.com/.default',
            'grant_type' => 'client_credentials'
        ];

        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $tokenResponse = curl_exec($ch);
        curl_close($ch);

        $tokenResult = json_decode($tokenResponse, true);
        if (!isset($tokenResult['access_token'])) {
            error_log("getAttachmentFile - Token error: " . json_encode($tokenResult));
            throw new Exception('Error al obtener token de acceso');
        }

        $accessToken = $tokenResult['access_token'];
        $_SESSION[$cacheKey] = $accessToken;
        $_SESSION[$cacheKey . '_exp'] = time() + 3000; // 50 min
        error_log("getAttachmentFile - Token nuevo");
    }

    // Descargar el archivo desde SharePoint usando el Drive Item ID
    $driveItemId = $attachment['drive_item_id'];
    error_log("getAttachmentFile - DriveItemId: $driveItemId");
    
    // Primero obtenemos el site ID
    $domain = getenv('SHAREPOINT_DOMAIN') ?: 'constv.sharepoint.com';
    $siteUrl = "https://graph.microsoft.com/v1.0/sites/$domain";
    
    $ch = curl_init($siteUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $siteResponse = curl_exec($ch);
    curl_close($ch);
    
    $siteResult = json_decode($siteResponse, true);
    if (!isset($siteResult['id'])) {
        error_log("getAttachmentFile - Site error: " . json_encode($siteResult));
        throw new Exception('Error al obtener site ID');
    }
    
    $siteId = $siteResult['id'];
    error_log("getAttachmentFile - Site ID: $siteId");
    
    // Ahora obtenemos el drive ID de la biblioteca específica
    $libraryName = getenv('SHAREPOINT_DOCUMENT_LIBRARY') ?: 'Directorio de Archivos/ Consultas';
    $drivesUrl = "https://graph.microsoft.com/v1.0/sites/$siteId/drives";
    
    $ch = curl_init($drivesUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $drivesResponse = curl_exec($ch);
    curl_close($ch);
    
    $drivesResult = json_decode($drivesResponse, true);
    if (!isset($drivesResult['value'])) {
        error_log("getAttachmentFile - Drives error: " . json_encode($drivesResult));
        throw new Exception('Error al obtener drives');
    }
    
    // Buscar el drive por nombre
    $driveId = null;
    foreach ($drivesResult['value'] as $drive) {
        if (isset($drive['name']) && $drive['name'] === $libraryName) {
            $driveId = $drive['id'];
            break;
        }
    }
    
    if (!$driveId) {
        error_log("getAttachmentFile - Drive not found. Available: " . json_encode(array_column($drivesResult['value'], 'name')));
        throw new Exception("No se encontró la biblioteca '$libraryName'");
    }
    
    error_log("getAttachmentFile - Drive ID: $driveId");
    
    // Try to obtain a pre-authenticated download URL from Graph metadata
    $metaUrl = "https://graph.microsoft.com/v1.0/drives/$driveId/items/$driveItemId";
    $ch = curl_init($metaUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken, 'Accept: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $metaResponse = curl_exec($ch);
    $metaHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $meta = json_decode($metaResponse, true);
    if (isset($meta['@microsoft.graph.downloadUrl'])) {
        // Use the pre-authenticated download URL provided by Graph.
        $downloadUrl = $meta['@microsoft.graph.downloadUrl'];
        error_log("getAttachmentFile - Obtained downloadUrl for item $driveItemId");

        // If caller explicitly requests proxy download, honor it
        $forceDownload = isset($_GET['download']) && ($_GET['download'] === '1' || $_GET['download'] === 'true');

        // Decide behavior by mime type: images can be redirected to display inline; other types use proxy download
        $isImage = isset($attachment['mime_type']) && preg_match('/^image\//', $attachment['mime_type']);

        if ($isImage && !$forceDownload) {
            // Let the browser load images directly from Graph (fast, inline display)
            error_log("getAttachmentFile - Redirecting to downloadUrl for image item $driveItemId");
            header('Location: ' . $downloadUrl);
            exit;
        }

        // For non-images or when download forced, fetch the binary from the downloadUrl and stream it with proper headers
        $ch = curl_init($downloadUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: */*']);
        $fileContent = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $fileContent !== false) {
            $fname = basename($attachment['nombre_archivo']);
            $mimeType = $attachment['mime_type'] ?? 'application/octet-stream';

            // Force download for non-images (or when requested). For images we could also stream inline if desired.
            header('Content-Type: ' . $mimeType);
            header('Content-Length: ' . strlen($fileContent));
            header('Cache-Control: private, max-age=3600');
            header('Content-Disposition: attachment; filename="' . $fname . '"');
            echo $fileContent;
            exit;
        }

        // If fetching the downloadUrl failed, fall back to the proxy content endpoint below
        error_log("getAttachmentFile - downloadUrl fetch failed (HTTP $httpCode), falling back to proxy endpoint");
    }

    // Fallback: download content via Graph proxy endpoint
    $downloadUrl = "https://graph.microsoft.com/v1.0/drives/$driveId/items/$driveItemId/content";
    error_log("getAttachmentFile - Fallback download URL: $downloadUrl");

    $ch = curl_init($downloadUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Seguir redirecciones
    $fileContent = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    error_log("getAttachmentFile - HTTP Code: $httpCode, Content length: " . strlen($fileContent));

    if ($httpCode !== 200) {
        error_log("getAttachmentFile - SharePoint error response: " . substr($fileContent, 0, 500));
        throw new Exception('Error al descargar archivo desde SharePoint (HTTP ' . $httpCode . ')');
    }

    // Determinar el tipo MIME basado en la extensión
    $extension = strtolower($attachment['extension']);
    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'pdf' => 'application/pdf',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls' => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt' => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'zip' => 'application/zip',
        'rar' => 'application/x-rar-compressed',
        '7z' => 'application/x-7z-compressed'
    ];

    $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';

    // Enviar headers para el archivo
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . strlen($fileContent));
    header('Cache-Control: private, max-age=3600'); // Cachear 1 hora
    header('Content-Disposition: inline; filename="' . $attachment['nombre_archivo'] . '"');

    // Enviar el contenido del archivo
    echo $fileContent;
    exit;

} catch (Exception $e) {
    error_log('Error en getAttachmentFile: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener el archivo: ' . $e->getMessage()
    ]);
    exit;
}

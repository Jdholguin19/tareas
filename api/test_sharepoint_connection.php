<?php
/**
 * Script de prueba para verificar la conexión con SharePoint
 * Ejecutar desde la terminal: php api/test_sharepoint_connection.php
 */

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Test de Conexión SharePoint</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #0078d4; padding-bottom: 10px; }
        h2 { color: #0078d4; margin-top: 30px; }
        .success { color: #28a745; background: #d4edda; padding: 10px; border-radius: 4px; border-left: 4px solid #28a745; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 4px; border-left: 4px solid #dc3545; }
        .warning { color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107; }
        .info { color: #004085; background: #cce5ff; padding: 10px; border-radius: 4px; border-left: 4px solid #0078d4; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #0078d4; color: white; }
        tr:hover { background-color: #f5f5f5; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .step { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        .step-number { display: inline-block; width: 30px; height: 30px; background: #0078d4; color: white; text-align: center; line-height: 30px; border-radius: 50%; margin-right: 10px; font-weight: bold; }
    </style>
</head>
<body>
<div class='container'>";

echo "<h1>🔧 Test de Conexión con SharePoint</h1>";
echo "<p><strong>Fecha:</strong> " . date('Y-m-d H:i:s') . "</p>";

// Cargar configuración
require_once __DIR__ . '/config/env_sharepoint.php';

echo "<h2>📋 Paso 1: Verificar Configuración</h2>";
echo "<table>";
echo "<tr><th>Configuración</th><th>Valor</th><th>Estado</th></tr>";

$configs = [
    'AZURE_TENANT_ID' => getenv('AZURE_TENANT_ID'),
    'AZURE_CLIENT_ID' => getenv('AZURE_CLIENT_ID'),
    'AZURE_CLIENT_SECRET' => getenv('AZURE_CLIENT_SECRET') ? '***' . substr(getenv('AZURE_CLIENT_SECRET'), -4) : null,
    'SHAREPOINT_DOMAIN' => getenv('SHAREPOINT_DOMAIN'),
    'SHAREPOINT_SITE_NAME' => getenv('SHAREPOINT_SITE_NAME') ?: '(sitio raíz)',
    'SHAREPOINT_ROOT_PATH' => getenv('SHAREPOINT_ROOT_PATH'),
];

$allConfigsOk = true;
foreach ($configs as $key => $value) {
    $status = $value ? "<span class='success'>✓ OK</span>" : "<span class='error'>✗ FALTA</span>";
    if (!$value) $allConfigsOk = false;
    echo "<tr><td><code>$key</code></td><td>" . htmlspecialchars($value ?: 'NO CONFIGURADO') . "</td><td>$status</td></tr>";
}
echo "</table>";

if (!$allConfigsOk) {
    echo "<div class='error'><strong>❌ ERROR:</strong> Faltan configuraciones necesarias. Revisa el archivo <code>api/config/env_sharepoint.php</code></div>";
    echo "</div></body></html>";
    exit;
}

echo "<div class='success'>✅ Todas las configuraciones están presentes</div>";

// Paso 2: Obtener Access Token
echo "<h2>🔑 Paso 2: Obtener Access Token de Azure AD</h2>";

$tenantId = getenv('AZURE_TENANT_ID');
$clientId = getenv('AZURE_CLIENT_ID');
$clientSecret = getenv('AZURE_CLIENT_SECRET');

$tokenUrl = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token";
$tokenData = http_build_query([
    'client_id' => $clientId,
    'scope' => 'https://graph.microsoft.com/.default',
    'client_secret' => $clientSecret,
    'grant_type' => 'client_credentials'
]);

$tokenOptions = [
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => $tokenData
    ]
];

echo "<div class='step'>";
echo "<span class='step-number'>1</span> Solicitando token a: <code>$tokenUrl</code><br>";

$tokenContext = stream_context_create($tokenOptions);
$tokenResponse = @file_get_contents($tokenUrl, false, $tokenContext);

if ($tokenResponse === false) {
    $error = error_get_last();
    echo "<div class='error'><strong>❌ ERROR al obtener token:</strong><br>" . htmlspecialchars($error['message']) . "</div>";
    echo "</div></div></body></html>";
    exit;
}

$tokenData = json_decode($tokenResponse, true);

if (isset($tokenData['error'])) {
    echo "<div class='error'><strong>❌ ERROR de Azure AD:</strong><br>";
    echo "<strong>Error:</strong> " . htmlspecialchars($tokenData['error']) . "<br>";
    echo "<strong>Descripción:</strong> " . htmlspecialchars($tokenData['error_description'] ?? 'Sin descripción') . "</div>";
    echo "</div></div></body></html>";
    exit;
}

if (!isset($tokenData['access_token'])) {
    echo "<div class='error'><strong>❌ ERROR:</strong> No se recibió access_token en la respuesta</div>";
    echo "<pre>" . htmlspecialchars(json_encode($tokenData, JSON_PRETTY_PRINT)) . "</pre>";
    echo "</div></div></body></html>";
    exit;
}

$accessToken = $tokenData['access_token'];
echo "<div class='success'>✅ Token obtenido exitosamente</div>";
echo "<div class='info'><strong>Token (primeros 50 caracteres):</strong> " . substr($accessToken, 0, 50) . "...</div>";
echo "<div class='info'><strong>Expira en:</strong> " . ($tokenData['expires_in'] ?? 'N/A') . " segundos</div>";
echo "</div>";

// Paso 3: Obtener Site ID
echo "<h2>🌐 Paso 3: Obtener SharePoint Site ID</h2>";

$domain = getenv('SHAREPOINT_DOMAIN');
$siteName = getenv('SHAREPOINT_SITE_NAME');

// Sitio raíz de SharePoint
if (empty($siteName)) {
    $siteUrl = "https://graph.microsoft.com/v1.0/sites/$domain";
} else {
    $siteUrl = "https://graph.microsoft.com/v1.0/sites/$domain:/sites/$siteName:";
}

echo "<div class='step'>";
echo "<span class='step-number'>1</span> Obteniendo sitio: <code>$siteUrl</code><br>";

$siteOptions = [
    'http' => [
        'method' => 'GET',
        'header' => "Authorization: Bearer $accessToken"
    ]
];

$siteContext = stream_context_create($siteOptions);
$siteResponse = @file_get_contents($siteUrl, false, $siteContext);

if ($siteResponse === false) {
    $error = error_get_last();
    echo "<div class='error'><strong>❌ ERROR al obtener Site ID:</strong><br>" . htmlspecialchars($error['message']) . "</div>";
    echo "<div class='warning'><strong>💡 Posibles soluciones:</strong><ul>";
    echo "<li>Verifica que la aplicación tenga permisos <strong>Sites.Read.All</strong> o <strong>Sites.ReadWrite.All</strong> en Azure AD</li>";
    echo "<li>Asegúrate de que los permisos estén <strong>otorgados por un administrador</strong></li>";
    echo "<li>Verifica que el dominio sea correcto: <code>$domain</code></li>";
    echo "</ul></div>";
    echo "</div></div></body></html>";
    exit;
}

$siteData = json_decode($siteResponse, true);

if (isset($siteData['error'])) {
    echo "<div class='error'><strong>❌ ERROR de Microsoft Graph:</strong><br>";
    echo "<strong>Error:</strong> " . htmlspecialchars($siteData['error']['code']) . "<br>";
    echo "<strong>Mensaje:</strong> " . htmlspecialchars($siteData['error']['message']) . "</div>";
    echo "</div></div></body></html>";
    exit;
}

if (!isset($siteData['id'])) {
    echo "<div class='error'><strong>❌ ERROR:</strong> No se recibió Site ID en la respuesta</div>";
    echo "<pre>" . htmlspecialchars(json_encode($siteData, JSON_PRETTY_PRINT)) . "</pre>";
    echo "</div></div></body></html>";
    exit;
}

$siteId = $siteData['id'];
echo "<div class='success'>✅ Site ID obtenido exitosamente</div>";
echo "<div class='info'><strong>Site ID:</strong> <code>" . htmlspecialchars($siteId) . "</code></div>";
echo "<div class='info'><strong>Nombre del sitio:</strong> " . htmlspecialchars($siteData['name'] ?? 'N/A') . "</div>";
echo "<div class='info'><strong>URL del sitio:</strong> <a href='" . htmlspecialchars($siteData['webUrl'] ?? '#') . "' target='_blank'>" . htmlspecialchars($siteData['webUrl'] ?? 'N/A') . "</a></div>";
echo "</div>";

// Paso 4: Buscar biblioteca de documentos
echo "<h2>💾 Paso 4: Buscar Biblioteca de Documentos</h2>";

$documentLibrary = getenv('SHAREPOINT_DOCUMENT_LIBRARY');
$drivesUrl = "https://graph.microsoft.com/v1.0/sites/$siteId/drives";

echo "<div class='step'>";
echo "<span class='step-number'>1</span> Buscando bibliotecas del sitio...<br>";

$drivesResponse = @file_get_contents($drivesUrl, false, $siteContext);

if ($drivesResponse === false) {
    $error = error_get_last();
    echo "<div class='error'><strong>❌ ERROR al obtener bibliotecas:</strong><br>" . htmlspecialchars($error['message']) . "</div>";
    echo "</div></div></body></html>";
    exit;
}

$drivesData = json_decode($drivesResponse, true);

if (isset($drivesData['error'])) {
    echo "<div class='error'><strong>❌ ERROR de Microsoft Graph:</strong><br>";
    echo "<strong>Error:</strong> " . htmlspecialchars($drivesData['error']['code']) . "<br>";
    echo "<strong>Mensaje:</strong> " . htmlspecialchars($drivesData['error']['message']) . "</div>";
    echo "</div></div></body></html>";
    exit;
}

$targetDriveId = null;
$targetDriveName = null;

if (isset($drivesData['value'])) {
    echo "<div class='info'><strong>Bibliotecas encontradas:</strong><ul>";
    foreach ($drivesData['value'] as $drive) {
        $driveName = htmlspecialchars($drive['name']);
        $driveId = substr($drive['id'], 0, 30) . "...";
        echo "<li>📚 $driveName (ID: $driveId)</li>";
        
        if ($drive['name'] === $documentLibrary) {
            $targetDriveId = $drive['id'];
            $targetDriveName = $drive['name'];
        }
    }
    echo "</ul></div>";
}

if (!$targetDriveId) {
    echo "<div class='error'><strong>❌ ERROR:</strong> No se encontró la biblioteca '<code>$documentLibrary</code>'</div>";
    echo "<div class='warning'><strong>💡 Solución:</strong><br>";
    echo "- Verifica que el nombre sea exacto (case-sensitive)<br>";
    echo "- Verifica que tengas permisos para acceder a esta biblioteca</div>";
    echo "</div></div></body></html>";
    exit;
}

echo "<div class='success'>✅ Biblioteca '$targetDriveName' encontrada</div>";
echo "<div class='info'><strong>Drive ID:</strong> <code>" . htmlspecialchars($targetDriveId) . "</code></div>";
echo "</div>";

// Paso 5: Verificar carpeta de adjuntos en la biblioteca correcta
echo "<h2>📁 Paso 5: Verificar Carpeta de Adjuntos</h2>";

$rootPath = getenv('SHAREPOINT_ROOT_PATH');
$encodedRootPath = rawurlencode($rootPath);
$folderUrl = "https://graph.microsoft.com/v1.0/drives/$targetDriveId/root:/$encodedRootPath";

echo "<div class='step'>";
echo "<span class='step-number'>1</span> Verificando carpeta en biblioteca '$targetDriveName': <code>$rootPath</code><br>";

$folderResponse = @file_get_contents($folderUrl, false, $siteContext);

if ($folderResponse === false) {
    echo "<div class='warning'>⚠️ La carpeta no existe todavía</div>";
    echo "<div class='info'>💡 <strong>Nota:</strong> La carpeta se creará automáticamente al subir el primer archivo</div>";
} else {
    $folderData = json_decode($folderResponse, true);
    
    if (isset($folderData['error'])) {
        echo "<div class='warning'>⚠️ Carpeta no encontrada:</div>";
        echo "<div class='error'>" . htmlspecialchars($folderData['error']['message']) . "</div>";
        echo "<div class='info'>💡 <strong>Nota:</strong> Se creará automáticamente al subir archivos</div>";
    } else {
        echo "<div class='success'>✅ Carpeta existe y es accesible</div>";
        echo "<div class='info'><strong>Nombre:</strong> " . htmlspecialchars($folderData['name'] ?? 'N/A') . "</div>";
        if (isset($folderData['webUrl'])) {
            echo "<div class='info'><strong>URL:</strong> <a href='" . htmlspecialchars($folderData['webUrl']) . "' target='_blank'>Ver en SharePoint</a></div>";
        }
    }
}
echo "</div>";

// Resumen final
echo "<h2>📊 Resumen Final</h2>";
echo "<div class='success'>";
echo "<h3>✅ Conexión con SharePoint Exitosa</h3>";
echo "<ul>";
echo "<li>✓ Autenticación con Azure AD funcional</li>";
echo "<li>✓ Acceso al sitio de SharePoint confirmado</li>";
echo "<li>✓ Drive accesible</li>";
echo "<li>✓ Configuración correcta</li>";
echo "</ul>";
echo "</div>";

echo "<div class='info'>";
echo "<h3>📝 Próximos Pasos</h3>";
echo "<ol>";
echo "<li>Si la carpeta <code>$rootPath</code> no existe, créala manualmente en SharePoint</li>";
echo "<li>Verifica los permisos de la aplicación en Azure AD</li>";
echo "<li>Prueba subir un archivo desde la aplicación</li>";
echo "</ol>";
echo "</div>";

echo "</div></body></html>";
?>

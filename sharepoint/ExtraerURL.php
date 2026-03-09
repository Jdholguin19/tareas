<?php

// Crenciales nuevas a usar para planics sharepoint      
// Nombre para mostrar:
// Planics-Sharepoint Id. de aplicación (cliente):
// bb032b2e-9836-466e-9bf7-ae3c337e5c1d
// Identificador de objeto:
// 5a8fd8af-c518-46c7-871a-cf6a99bdf665
// Id. de directorio (inquilino):
// b9618ac6-2648-41ed-bb4f-03bcd94a7493
// Secretro valor: CONFIGURAR_EN_VARIABLE_DE_ENTORNO 
// Id de secretro: 93490676-b507-414b-9c81-3fa820f2e457
// el root path nose cual puede ser pero este es link de la carpeta https://constv.sharepoint.com/Directorio%20de%20Archivos%20Consultas/Forms/AllItems.aspx?id=%2FDirectorio%20de%20Archivos%20Consultas%2F09%2E%20IT%2FDesarrollo%2FAdjuntos%5FPlaniCS&viewid=0199030b%2De0ca%2D476c%2Da736%2D24fab68f57bb&e=5%3Ae5a5388bf02f436d8114057c5d0adf3a&sharingv2=true&fromShare=true&at=9&CID=bbfc688d%2D4108%2D4403%2D8213%2D81dee2ef2eee&FolderCTID=0x012000E8A37E91C4BADB48891540432107AFCB
require_once __DIR__ . '/../config/db.php';

$tenantId = getenv('AZURE_TENANT_ID') ?: '';
$clientId = getenv('AZURE_CLIENT_ID') ?: '';
$clientSecret = getenv('AZURE_CLIENT_SECRET') ?: '';

$domain = 'constv-my.sharepoint.com';
$user = 'aburgos_thaliavictoria_com_ec';
$rootPath = '- FEDATARIO/FOTOS DE INSPECCIONES';

$totalImagenes = 0;
$db = DB::getDB();

// Cache de urbanizaciones para evitar consultas repetitivas
$urbanizaciones_cache = null;
$etapas_cache = null;

function obtenerUrbanizaciones($db) {
    global $urbanizaciones_cache;
    
    if ($urbanizaciones_cache === null) {
        $stmt = $db->prepare("SELECT id, nombre FROM urbanizacion WHERE estado = 1");
        $stmt->execute();
        $urbanizaciones_cache = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $urbanizaciones_cache[strtoupper($row['nombre'])] = $row['id'];
        }
    }
    
    return $urbanizaciones_cache;
}

function obtenerEtapas($db) {
    global $etapas_cache;
    
    if ($etapas_cache === null) {
        $stmt = $db->prepare("SELECT id, porcentaje FROM etapa_construccion WHERE estado = 1");
        $stmt->execute();
        $etapas_cache = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $etapas_cache[$row['id']] = $row['porcentaje'];
        }
    }
    
    return $etapas_cache;
}

function getAccessToken($tenantId, $clientId, $clientSecret) {
    $url = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token";
    $data = http_build_query([
        'client_id' => $clientId,
        'scope' => 'https://graph.microsoft.com/.default',
        'client_secret' => $clientSecret,
        'grant_type' => 'client_credentials'
    ]);
    $opts = ['http' => ['method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded', 'content' => $data]];
    $res = file_get_contents($url, false, stream_context_create($opts));
    return json_decode($res, true)['access_token'] ?? die("❌ Error obteniendo token");
}

function getSiteId($accessToken, $domain, $user) {
    $url = "https://graph.microsoft.com/v1.0/sites/$domain:/personal/$user:";
    $opts = ['http' => ['method' => 'GET', 'header' => "Authorization: Bearer $accessToken"]];
    $res = file_get_contents($url, false, stream_context_create($opts));
    return json_decode($res, true)['id'] ?? die("❌ Error obteniendo siteId");
}

function detectarEtapa($ruta) {
    if (strpos($ruta, 'Visita 1') !== false) return 1;
    if (strpos($ruta, 'Visita 2') !== false) return 2;
    if (strpos($ruta, 'Visita 3') !== false) return 3;
    if (strpos($ruta, 'Visita 4') !== false) return 4;
    return null;
}

function obtenerPorcentajeEtapa($id_etapa, $db) {
    $etapas = obtenerEtapas($db);
    return $etapas[$id_etapa] ?? null;
}

function extraerMzVillaUrbanizacion($ruta, $db) {
    $partes = explode('/', $ruta);
    $id_urbanizacion = null;
    $mz = null;
    $villa = null;
    
    // Obtener urbanizaciones dinámicamente de la base de datos
    $urbanizaciones = obtenerUrbanizaciones($db);
    
    // Primero busca la urbanización y obtiene su ID
    foreach ($partes as $parte) {
        $nombre_urbanizacion = strtoupper($parte);
        if (isset($urbanizaciones[$nombre_urbanizacion])) {
            $id_urbanizacion = $urbanizaciones[$nombre_urbanizacion];
            break;
        }
    }
    
    // Luego busca MZ y Villa
    foreach ($partes as $i => $parte) {
        // Busca un patrón de 4 dígitos (mz)
        if (preg_match('/^\d{4}$/', $parte) && isset($partes[$i + 1])) {
            $mz = $parte;
            $siguiente = $partes[$i + 1];
            
            // ESPECIAL PARA ARIENZO: Formato "7100-18-CLIENTE" o "7100-11-ISABELA"
            if ($id_urbanizacion == 1 && preg_match('/^\d+-(\d+)-[A-Z]/', $siguiente, $matches)) {
                $villa = $matches[1]; // Toma solo el número del medio
                break;
            }
            
            // Caso general: Formato "123-456" - toma la parte después del guion
            if (preg_match('/^\d+-\d+$/', $siguiente)) {
                $villa = explode('-', $siguiente)[1];
                break;
            }
            
            // Caso: Formato "123-" - toma solo la parte antes del guion
            if (preg_match('/^(\d+)-/', $siguiente, $matches)) {
                $villa = $matches[1];
                break;
            }
            
            // Caso: Es puramente numérico
            if (preg_match('/^\d+$/', $siguiente)) {
                $villa = $siguiente;
                break;
            }
        }
    }
    
    return [$mz, $villa, $id_urbanizacion];
}

function guardarEnBD($db, $data) {
    $stmt = $db->prepare("INSERT INTO progreso_construccion (
        id_etapa, mz, villa, id_urbanizacion, porcentaje, ruta_descarga_sharepoint, ruta_visualizacion_sharepoint, drive_item_id,
        fecha_creado_sharepoint, usuario_creador, fecha_modificado_sharepoint,
        usuario_modificado_sharepoint, url_imagen
    ) VALUES (
        :id_etapa, :mz, :villa, :id_urbanizacion, :porcentaje, :ruta_descarga, :ruta_visual, :drive_item_id, :fecha_creado,
        :usuario_creador, :fecha_modificado, :usuario_modificado, :url
    ) ON DUPLICATE KEY UPDATE
        id_etapa = VALUES(id_etapa),
        mz = VALUES(mz),
        villa = VALUES(villa),
        id_urbanizacion = VALUES(id_urbanizacion),
        porcentaje = VALUES(porcentaje),
        ruta_descarga_sharepoint = VALUES(ruta_descarga_sharepoint),
        ruta_visualizacion_sharepoint = VALUES(ruta_visualizacion_sharepoint),
        fecha_creado_sharepoint = VALUES(fecha_creado_sharepoint),
        usuario_creador = VALUES(usuario_creador),
        fecha_modificado_sharepoint = VALUES(fecha_modificado_sharepoint),
        usuario_modificado_sharepoint = VALUES(usuario_modificado_sharepoint),
        url_imagen = VALUES(url_imagen),
        fecha_registro = CURRENT_TIMESTAMP;
    ");

    $stmt->execute([
        ':id_etapa' => $data['id_etapa'],
        ':mz' => $data['mz'],
        ':villa' => $data['villa'],
        ':id_urbanizacion' => $data['id_urbanizacion'],
        ':porcentaje' => $data['porcentaje'],
        ':ruta_descarga' => $data['ruta_descarga'],
        ':ruta_visual' => $data['ruta_visual'],
        ':drive_item_id'      => $data['drive_item_id'],
        ':fecha_creado' => $data['fecha_creado'],
        ':usuario_creador' => $data['usuario_creador'],
        ':fecha_modificado' => $data['fecha_modificado'],
        ':usuario_modificado' => $data['usuario_modificado'],
        ':url' => $data['url_imagen']
    ]);
}

function listarContenido($accessToken, $siteId, $ruta, $nivel = 0, &$contador = 0, $rutaCompleta = "") {
    global $db;
    $encodedPath = rawurlencode("/$ruta");
    $url = "https://graph.microsoft.com/v1.0/sites/$siteId/drive/root:$encodedPath:/children";
    $opts = ['http' => ['method' => 'GET', 'header' => "Authorization: Bearer $accessToken"]];
    $res = file_get_contents($url, false, stream_context_create($opts));
    $items = json_decode($res, true)['value'] ?? [];

    foreach ($items as $item) {
        $nombre = $item['name'];
        $pathActual = $rutaCompleta . '/' . $nombre;

        if (isset($item['folder'])) {
            echo "<div><strong>📁 $pathActual</strong></div>";
            listarContenido($accessToken, $siteId, "$ruta/$nombre", $nivel + 1, $contador, $pathActual);
        } elseif (isset($item['@microsoft.graph.downloadUrl'])) {
            $ext = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg', 'jpeg', 'png'])) {
                $contador++;
                $urlDescarga = $item['@microsoft.graph.downloadUrl'];
                $urlSharePoint = $item['webUrl'] ?? '';

                $creado = date("Y-m-d H:i", strtotime($item['createdDateTime'] ?? ''));
                $modificado = date("Y-m-d H:i", strtotime($item['lastModifiedDateTime'] ?? ''));

                $creadoPor = $item['createdBy']['user']['displayName'] ?? 'Desconocido';
                $creadoEmail = $item['createdBy']['user']['email'] ?? '';
                $modificadoPor = $item['lastModifiedBy']['user']['displayName'] ?? 'Desconocido';

                list($mz, $villa, $id_urbanizacion) = extraerMzVillaUrbanizacion($pathActual, $db);
                $etapa = detectarEtapa($pathActual);
                $porcentaje = obtenerPorcentajeEtapa($etapa, $db);
                
                // Debug: mostrar lo que se está extrayendo
                echo "<div style='color: #666; font-size: 12px; margin-left: 20px;'>
                    🔍 DEBUG - Ruta: $pathActual<br>
                    📍 MZ: " . ($mz ?? 'NULL') . " | Villa: " . ($villa ?? 'NULL') . " | ID Urbanización: " . ($id_urbanizacion ?? 'NULL') . "<br>
                    🏗️ Etapa: " . ($etapa ?? 'NULL') . " | Porcentaje: " . ($porcentaje ?? 'NULL') . "%
                </div>";

                echo "<div style='margin-bottom: 15px;'>
                    🖼️ <strong>$pathActual</strong><br>
                    🔗 <a href='$urlDescarga' target='_blank'>[Descargar]</a> |
                    👁️ <a href='$urlSharePoint' target='_blank'>[Ver en SharePoint]</a><br>
                    🕒 Creado: $creado | Por: $creadoPor" .
                    ($creadoEmail ? " &lt;$creadoEmail&gt;" : "") . "<br>
                    📝 Modificado: $modificado | Por: $modificadoPor
                </div>";

                guardarEnBD($db, [
                    'id_etapa' => $etapa,
                    'mz' => $mz,
                    'villa' => $villa,
                    'id_urbanizacion' => $id_urbanizacion,
                    'porcentaje' => $porcentaje,
                    'ruta_descarga' => $urlDescarga,
                    'ruta_visual' => $urlSharePoint,
                    'drive_item_id' => $item['id'],
                    'fecha_creado' => date("Y-m-d H:i:s", strtotime($item['createdDateTime'] ?? '')),
                    'usuario_creador' => $creadoPor,
                    'fecha_modificado' => date("Y-m-d H:i:s", strtotime($item['lastModifiedDateTime'] ?? '')),
                    'usuario_modificado' => $modificadoPor,
                    'url_imagen' => $pathActual
                ]);
            }
        }
    }
}

$token = getAccessToken($tenantId, $clientId, $clientSecret);
$siteId = getSiteId($token, $domain, $user);

// Mostrar información de configuración dinámica
echo "<h2>🔧 Configuración Dinámica</h2>";
echo "<div style='background: #f0f0f0; padding: 15px; margin-bottom: 20px;'>";

echo "<h3>🏘️ Urbanizaciones disponibles:</h3>";
$urbanizaciones = obtenerUrbanizaciones($db);
foreach ($urbanizaciones as $nombre => $id) {
    echo "• <strong>$nombre</strong> (ID: $id)<br>";
}

echo "<h3>🏗️ Etapas disponibles:</h3>";
$etapas = obtenerEtapas($db);
foreach ($etapas as $id => $porcentaje) {
    echo "• <strong>Etapa $id</strong> → $porcentaje%<br>";
}

echo "</div>";

echo "<h2>📂 Explorando: $rootPath</h2>";
listarContenido($token, $siteId, $rootPath, 0, $totalImagenes, $rootPath);

echo "<hr><h3>🧮 Total de imágenes encontradas: $totalImagenes</h3>";

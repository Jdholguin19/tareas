<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/auth_helper.php';
require_once __DIR__ . '/../helpers/estructura_helper.php';

setupCORS();
header('Content-Type: application/json; charset=utf-8');
$db = DB::getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Helper: Verificar si estamos en las dos primeras semanas del mes
function isFirstWeekOfMonth() {
    $dayOfMonth = (int)date('j');
    return $dayOfMonth <= 28;
}

// Helper: Calcular fecha máxima para compromiso de palanca (7 días)
function getMaxDateForPalancaCompromiso() {
    return date('Y-m-d', strtotime('+7 days'));
}

try {
    if ($method === 'GET') {
        $anio = $_GET['anio'] ?? date('Y');
        $mes = $_GET['mes'] ?? date('n');
        $user_id = $_GET['user_id'] ?? null;
        $tipo = $_GET['tipo'] ?? null;
        $estado = $_GET['estado'] ?? null;
        $compromiso_padre_id = $_GET['compromiso_padre_id'] ?? null;
        $palanca_id = $_GET['palanca_id'] ?? null;
        $semana = $_GET['semana'] ?? null;
        $filtrarPorEstructura = isset($_GET['filtrar_estructura']) && $_GET['filtrar_estructura'] === '1';

        // Obtener usuario actual para filtrar por estructura
        $token = get_bearer_token();
        $currentUser = get_user_by_token($db, $token);
        $isCurrentUserAdmin = $currentUser ? isAdmin($db, $currentUser['id']) : false;

        $sql = '
            SELECT c.*,
                   p.nombre_completo as user_nombre,
                   p.cargo as user_cargo,
                   p2.nombre_completo as creador_nombre,
                   pal.nombre as palanca_nombre,
                   pal.codigo as palanca_codigo,
                   vg.id as vg_id,
                   inh.descripcion as ventaja_descripcion,
                   padre.descripcion as padre_descripcion
            FROM compromisos c
            LEFT JOIN profiles p ON p.id = c.user_id
            LEFT JOIN profiles p2 ON p2.id = c.creado_por
            LEFT JOIN palancas pal ON pal.id = c.palanca_id
            LEFT JOIN ventajas_ganadoras vg ON vg.id = c.ventaja_ganadora_id
            LEFT JOIN inhibidores inh ON inh.id = vg.inhibidor_id
            LEFT JOIN compromisos padre ON padre.id = c.compromiso_padre_id
            WHERE c.anio = :anio AND c.mes = :mes
        ';
        $params = [':anio' => $anio, ':mes' => $mes];

        // Filtrar por estructura organizacional si no es admin O si se fuerza el filtro
        if ($currentUser && ($filtrarPorEstructura || !$isCurrentUserAdmin)) {
            $allowedUserIds = getUsersInStructure($db, $currentUser['id']);
            $placeholders = [];
            foreach ($allowedUserIds as $idx => $uid) {
                $key = ':allowed_' . $idx;
                $placeholders[] = $key;
                $params[$key] = $uid;
            }
            $sql .= ' AND c.user_id IN (' . implode(',', $placeholders) . ')';
        }

        if ($user_id) {
            $sql .= ' AND c.user_id = :user_id';
            $params[':user_id'] = $user_id;
        }

        if ($tipo) {
            $sql .= ' AND c.tipo = :tipo';
            $params[':tipo'] = $tipo;
        }

        if ($estado) {
            $sql .= ' AND c.estado = :estado';
            $params[':estado'] = $estado;
        }

        if ($compromiso_padre_id) {
            $sql .= ' AND c.compromiso_padre_id = :padre_id';
            $params[':padre_id'] = $compromiso_padre_id;
        }

        if ($palanca_id) {
            $sql .= ' AND c.palanca_id = :palanca_id';
            $params[':palanca_id'] = $palanca_id;
        }

        if ($semana) {
            $sql .= ' AND c.semana_origen = :semana';
            $params[':semana'] = $semana;
        }

        $sql .= ' ORDER BY c.fecha_compromiso ASC, c.created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $canCreateVentajaCompromiso = isFirstWeekOfMonth();
        $maxDatePalanca = getMaxDateForPalancaCompromiso();

        echo json_encode([
            'ok' => true,
            'data' => $rows,
            'meta' => [
                'can_create_ventaja_compromiso' => $canCreateVentajaCompromiso,
                'max_date_palanca_compromiso' => $maxDatePalanca,
                'is_first_week' => $canCreateVentajaCompromiso
            ]
        ]);
        exit;
    }    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $token = get_bearer_token();
        $user = get_user_by_token($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'message' => 'Unauthorized']);
            exit;
        }

        // Handle delete action
        if (isset($data['action']) && $data['action'] === 'delete' && isset($data['id'])) {
            $stmtOwner = $db->prepare('SELECT creado_por FROM compromisos WHERE id = :id LIMIT 1');
            $stmtOwner->execute([':id' => $data['id']]);
            $row = $stmtOwner->fetch(PDO::FETCH_ASSOC);
            $creadorId = $row['creado_por'] ?? null;
            
            $stmtAdmin = $db->prepare('SELECT 1 FROM user_roles WHERE user_id = :id AND role = :role LIMIT 1');
            $stmtAdmin->execute([':id' => $user['id'], ':role' => 'administrador']);
            $isAdmin = (bool)$stmtAdmin->fetch(PDO::FETCH_ASSOC);
            
            if (!$isAdmin && $user['id'] !== $creadorId) {
                http_response_code(403);
                echo json_encode(['ok' => false, 'message' => 'Forbidden']);
                exit;
            }

            // También eliminar sub-compromisos
            $stmt = $db->prepare('DELETE FROM compromisos WHERE id = :id OR compromiso_padre_id = :id');
            $stmt->execute([':id' => $data['id']]);
            echo json_encode(['ok' => true]);
            exit;
        }

        // Handle update
        if (isset($data['id']) && !isset($data['action'])) {
            $stmtOwner = $db->prepare('SELECT creado_por FROM compromisos WHERE id = :id LIMIT 1');
            $stmtOwner->execute([':id' => $data['id']]);
            $row = $stmtOwner->fetch(PDO::FETCH_ASSOC);
            $creadorId = $row['creado_por'] ?? null;
            
            $stmtAdmin = $db->prepare('SELECT 1 FROM user_roles WHERE user_id = :id AND role = :role LIMIT 1');
            $stmtAdmin->execute([':id' => $user['id'], ':role' => 'administrador']);
            $isAdmin = (bool)$stmtAdmin->fetch(PDO::FETCH_ASSOC);
            
            if (!$isAdmin && $user['id'] !== $creadorId) {
                http_response_code(403);
                echo json_encode(['ok' => false, 'message' => 'Forbidden - only creator or admin']);
                exit;
            }

            // Build dynamic UPDATE
            $updates = [];
            $params = [':id' => $data['id']];

            if (array_key_exists('descripcion', $data)) {
                $updates[] = 'descripcion = :descripcion';
                $params[':descripcion'] = $data['descripcion'];
            }
            if (array_key_exists('estado', $data)) {
                $updates[] = 'estado = :estado';
                $params[':estado'] = $data['estado'];
                
                // Si se marca como completado, registrar la fecha
                if ($data['estado'] === 'completado' && !isset($data['fecha_cumplimiento'])) {
                    $updates[] = 'fecha_cumplimiento = CURDATE()';
                }
            }
            if (array_key_exists('fecha_compromiso', $data)) {
                $updates[] = 'fecha_compromiso = :fecha_compromiso';
                $params[':fecha_compromiso'] = $data['fecha_compromiso'];
            }
            if (array_key_exists('fecha_cumplimiento', $data)) {
                $updates[] = 'fecha_cumplimiento = :fecha_cumplimiento';
                $params[':fecha_cumplimiento'] = $data['fecha_cumplimiento'];
            }
            if (array_key_exists('notas', $data)) {
                $updates[] = 'notas = :notas';
                $params[':notas'] = $data['notas'];
            }

            if (empty($updates)) {
                echo json_encode(['ok' => true, 'message' => 'No fields to update']);
                exit;
            }

            $sql = 'UPDATE compromisos SET ' . implode(', ', $updates) . ' WHERE id = :id';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['ok' => true]);
            exit;
        }

        // Create new compromiso
        $tipo = $data['tipo'] ?? 'ventaja_ganadora';
        $user_id = $data['user_id'] ?? null;
        $descripcion = $data['descripcion'] ?? null;
        $fecha_compromiso = $data['fecha_compromiso'] ?? null;
        $anio = $data['anio'] ?? date('Y');
        $mes = $data['mes'] ?? date('n');
        $notas = $data['notas'] ?? null;
        
        // Campos específicos por tipo
        $compromiso_padre_id = $data['compromiso_padre_id'] ?? null;
        $ventaja_ganadora_id = $data['ventaja_ganadora_id'] ?? null;
        $palanca_id = $data['palanca_id'] ?? null;
        $semana_origen = $data['semana_origen'] ?? null;
        $valor_planificado = $data['valor_planificado'] ?? null;
        $valor_real = $data['valor_real'] ?? null;
        $diferencia = $data['diferencia'] ?? null;

        if (!$user_id || !$descripcion || !$fecha_compromiso) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'user_id, descripcion y fecha_compromiso son requeridos']);
            exit;
        }

        // Validaciones según tipo
        if ($tipo === 'ventaja_ganadora') {
            // Solo se puede crear en primera semana del mes (excepto sub-compromisos)
            if (!$compromiso_padre_id && !isFirstWeekOfMonth()) {
                http_response_code(422);
                echo json_encode([
                    'ok' => false, 
                    'message' => 'Los compromisos de Ventaja Ganadora solo se pueden crear en las dos primeras semanas del mes'
                ]);
                exit;
            }
            
            // Debe tener ventaja_ganadora_id o compromiso_padre_id
            if (!$ventaja_ganadora_id && !$compromiso_padre_id) {
                http_response_code(422);
                echo json_encode([
                    'ok' => false, 
                    'message' => 'Debe especificar ventaja_ganadora_id o compromiso_padre_id'
                ]);
                exit;
            }
        }
        
        if ($tipo === 'palanca') {
            // Validar que la fecha no sea mayor a 7 días
            $maxDate = strtotime('+7 days');
            $fechaComp = strtotime($fecha_compromiso);
            
            if ($fechaComp > $maxDate) {
                http_response_code(422);
                echo json_encode([
                    'ok' => false, 
                    'message' => 'La fecha de compromiso para palancas no puede ser mayor a 7 días'
                ]);
                exit;
            }
            
            // Debe tener palanca_id y datos de la diferencia
            if (!$palanca_id) {
                http_response_code(422);
                echo json_encode([
                    'ok' => false, 
                    'message' => 'Debe especificar palanca_id para compromisos de tipo palanca'
                ]);
                exit;
            }
        }

        $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $stmt = $db->prepare('
            INSERT INTO compromisos (
                id, tipo, user_id, creado_por, descripcion, 
                compromiso_padre_id, ventaja_ganadora_id, palanca_id,
                semana_origen, valor_planificado, valor_real, diferencia,
                fecha_creacion, fecha_compromiso, estado, anio, mes, notas
            )
            VALUES (
                :id, :tipo, :user_id, :creado_por, :descripcion,
                :compromiso_padre_id, :ventaja_ganadora_id, :palanca_id,
                :semana_origen, :valor_planificado, :valor_real, :diferencia,
                CURDATE(), :fecha_compromiso, :estado, :anio, :mes, :notas
            )
        ');
        $stmt->execute([
            ':id' => $id,
            ':tipo' => $tipo,
            ':user_id' => $user_id,
            ':creado_por' => $user['id'],
            ':descripcion' => $descripcion,
            ':compromiso_padre_id' => $compromiso_padre_id,
            ':ventaja_ganadora_id' => $ventaja_ganadora_id,
            ':palanca_id' => $palanca_id,
            ':semana_origen' => $semana_origen,
            ':valor_planificado' => $valor_planificado,
            ':valor_real' => $valor_real,
            ':diferencia' => $diferencia,
            ':fecha_compromiso' => $fecha_compromiso,
            ':estado' => 'pendiente',
            ':anio' => $anio,
            ':mes' => $mes,
            ':notas' => $notas
        ]);

        // Intentar sincronizar con Planics (no bloquear respuesta principal)
        $planicsSync = null;
        try {
            require_once __DIR__ . '/../sync/sync_planics.php';
            $planicsSync = sync_compromiso_to_planics($db, $id);
        } catch (Throwable $e) {
            error_log('Planics sync failed: ' . $e->getMessage());
            $planicsSync = ['ok' => false, 'error' => $e->getMessage()];
        }

        echo json_encode(['ok' => true, 'id' => $id, 'planics' => $planicsSync]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
} catch (Throwable $e) {
    error_log('compromisos error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Internal server error: ' . $e->getMessage()]);
}

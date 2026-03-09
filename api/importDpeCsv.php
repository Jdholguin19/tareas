<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Verify session
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

// Check admin role
try {
    $roleStmt = $pdo->prepare("SELECT rol_id FROM usuarios WHERE id = ?");
    $roleStmt->execute([$userId]);
    $role = $roleStmt->fetchColumn();
    if ((int)$role !== 2) {
        echo json_encode(['error' => 'Acceso denegado']);
        exit;
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Error validando permisos']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
$mapping = $payload['mapping'] ?? [];
$rows = $payload['rows'] ?? [];
$fallbackMemberId = isset($payload['fallbackMemberId']) ? (int)$payload['fallbackMemberId'] : null;
$extraMemberIds = $payload['extraMemberIds'] ?? [];

if (!is_array($mapping) || !is_array($rows)) {
    echo json_encode(['error' => 'Payload inválido']);
    exit;
}

$extraMemberIds = is_array($extraMemberIds) ? $extraMemberIds : [];
$extraMemberIds = array_values(array_unique(array_filter(array_map(function ($id) {
    return $id ? (int)$id : null;
}, $extraMemberIds))));

// Helper functions
$normalize = function ($value) {
    $value = trim((string)$value);
    if (function_exists('mb_convert_encoding')) {
        $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8, ISO-8859-1, Windows-1252');
    } else {
        $value = iconv('UTF-8', 'UTF-8//IGNORE', $value);
    }
    return $value;
};

$normalizeName = function ($value) use ($normalize) {
    $value = $normalize($value);
    $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    $value = strtolower($value);
    $value = preg_replace('/[^a-z0-9]+/', '', $value);
    return $value;
};

$parseDate = function ($value) {
    $value = trim((string)$value);
    if ($value === '') return null;

    $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y', 'd.m.Y'];
    foreach ($formats as $format) {
        $dt = DateTime::createFromFormat($format, $value);
        if ($dt && $dt->format($format) === $value) {
            return $dt->format('Y-m-d');
        }
    }

    $ts = strtotime($value);
    if ($ts) {
        return date('Y-m-d', $ts);
    }

    return null;
};

$parseDateTime = function ($value) use ($parseDate) {
    $date = $parseDate($value);
    return $date ? $date . ' 00:00:00' : null;
};

$getValue = function ($row, $key) use ($mapping) {
    if (!isset($mapping[$key]) || $mapping[$key] === '') return null;
    $header = $mapping[$key];
    return $row[$header] ?? null;
};

$resolveIdByName = function ($table, $column, $value) use ($pdo) {
    $value = trim((string)$value);
    if ($value === '') return null;
    $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE {$column} = ? LIMIT 1");
    $stmt->execute([$value]);
    $id = $stmt->fetchColumn();
    if ($id) return (int)$id;

    $insert = $pdo->prepare("INSERT INTO {$table} ({$column}) VALUES (?)");
    $insert->execute([$value]);
    return (int)$pdo->lastInsertId();
};

$warnings = [];
$inserted = 0;

$usersStmt = $pdo->prepare("SELECT id, username, email FROM usuarios");
$usersStmt->execute();
$allUsers = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

$findUserId = function ($name) use ($allUsers, $normalizeName) {
    $target = $normalizeName($name);
    if ($target === '') return null;

    foreach ($allUsers as $user) {
        $uName = $normalizeName($user['username'] ?? '');
        $uEmail = $normalizeName($user['email'] ?? '');
        if ($target === $uName || $target === $uEmail) {
            return (int)$user['id'];
        }
        if ($uName !== '' && (strpos($uName, $target) !== false || strpos($target, $uName) !== false)) {
            return (int)$user['id'];
        }
    }

    return null;
};

// Ensure DPE lookup tables exist
$pdo->exec("CREATE TABLE IF NOT EXISTS tipo_objetivo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS etapas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

// Ensure columns in tareas
$columns = $pdo->query("SHOW COLUMNS FROM tareas")->fetchAll(PDO::FETCH_COLUMN);
$alterStatements = [];
if (!in_array('tipo_objetivo_id', $columns, true)) {
    $alterStatements[] = "ADD COLUMN tipo_objetivo_id INT NULL";
}
if (!in_array('producto_id', $columns, true)) {
    $alterStatements[] = "ADD COLUMN producto_id INT NULL";
}
if (!in_array('etapa_id', $columns, true)) {
    $alterStatements[] = "ADD COLUMN etapa_id INT NULL";
}
if (!empty($alterStatements)) {
    $pdo->exec("ALTER TABLE tareas " . implode(', ', $alterStatements));
}

$pdo->beginTransaction();
try {
    $assignStmt = $pdo->prepare("INSERT IGNORE INTO tareas_asignados (tarea_id, usuario_id) VALUES (?, ?)");
    foreach ($rows as $index => $row) {
        $projectName = $normalize($getValue($row, 'project_name'));
        $projectEnd = $parseDate($getValue($row, 'project_end'));
        $taskTitle = $normalize($getValue($row, 'task_title'));

        if ($projectName === '' || $taskTitle === '') {
            $warnings[] = "Fila " . ($index + 2) . ": falta NombreProyecto o NombreDPE.";
            continue;
        }

        $tipoObjetivo = $normalize($getValue($row, 'tipo_objetivo'));
        $producto = $normalize($getValue($row, 'producto'));
        $etapa = $normalize($getValue($row, 'etapa'));
        $departmentName = $normalize($getValue($row, 'department'));
        $responsableName = $normalize($getValue($row, 'responsable'));
        $coResponsableName = $normalize($getValue($row, 'co_responsable'));
        $estado = strtolower(trim((string)$getValue($row, 'estado')));
        $observaciones = $normalize($getValue($row, 'observaciones'));

        $taskStart = $parseDate($getValue($row, 'task_start'));
        $taskEnd = $parseDate($getValue($row, 'task_end'));
        $taskCompleted = $parseDateTime($getValue($row, 'task_completed'));

        $duration = $getValue($row, 'task_duration');
        if ((!$taskEnd || !$taskStart) && $duration) {
            $durationDays = (int)$duration;
            if ($durationDays > 0 && $taskStart) {
                $dt = new DateTime($taskStart);
                $dt->modify('+' . $durationDays . ' days');
                $taskEnd = $dt->format('Y-m-d');
            }
        }

        $estadoMap = [
            'pendiente' => 'pendiente',
            'activo' => 'pendiente',
            'en progreso' => 'en_progreso',
            'en_progreso' => 'en_progreso',
            'en espera' => 'en_espera',
            'en_espera' => 'en_espera',
            'completada' => 'completada',
            'completado' => 'completada',
            'finalizada' => 'completada',
            'finalizado' => 'completada',
            'cerrado' => 'completada',
            'cancelado' => 'cancelada'
        ];
        $estadoFinal = $estadoMap[$estado] ?? 'pendiente';
        if ($taskCompleted && $estadoFinal !== 'completada') {
            $estadoFinal = 'completada';
        }

        $projectId = $resolveIdByName('proyectos', 'nombre', $projectName);
        if ($projectEnd) {
            $stmt = $pdo->prepare("UPDATE proyectos SET fecha_vencimiento = COALESCE(fecha_vencimiento, ?) WHERE id = ?");
            $stmt->execute([$projectEnd, $projectId]);
        }

        $departmentId = null;
        if ($departmentName !== '') {
            $departmentId = $resolveIdByName('departamentos', 'nombre', $departmentName);
        }

        $responsableId = null;
        if ($responsableName !== '') {
            $responsableId = $findUserId($responsableName);
        }
        if (!$responsableId) {
            $responsableId = $userId;
            $warnings[] = "Fila " . ($index + 2) . ": Responsable no encontrado, usando usuario actual.";
        }

        $tipoObjetivoId = $tipoObjetivo !== '' ? $resolveIdByName('tipo_objetivo', 'nombre', $tipoObjetivo) : null;
        $productoId = $producto !== '' ? $resolveIdByName('productos', 'nombre', $producto) : null;
        $etapaId = $etapa !== '' ? $resolveIdByName('etapas', 'nombre', $etapa) : null;

        $progreso = ($estadoFinal === 'completada' || $taskCompleted) ? 100.00 : 0.00;

        $insertTask = $pdo->prepare("
            INSERT INTO tareas (
                titulo, descripcion, proyecto_id, departamento_id, asignado_a,
                creado_por, tarea_padre_id, tipos_tareas_id, estado, prioridad, importancia,
                progreso, fecha_inicio, fecha_vencimiento, fecha_completada,
                tipo_objetivo_id, producto_id, etapa_id
            ) VALUES (
                ?, ?, ?, ?, NULL,
                ?, NULL, 5, ?, 'media', 'media',
                ?, ?, ?, ?,
                ?, ?, ?
            )
        ");
        $insertTask->execute([
            $taskTitle,
            $observaciones ?: null,
            $projectId,
            $departmentId,
            $responsableId,
            $estadoFinal,
            $progreso,
            $taskStart,
            $taskEnd,
            $taskCompleted,
            $tipoObjetivoId,
            $productoId,
            $etapaId
        ]);

        $taskId = (int)$pdo->lastInsertId();

        if ($coResponsableName !== '') {
            $coNames = preg_split('/[;,]/', $coResponsableName);
            foreach ($coNames as $name) {
                $name = trim($name);
                if ($name === '') continue;
                $coId = $findUserId($name);
                if ($coId) {
                    $assignStmt->execute([$taskId, $coId]);
                } else {
                    $warnings[] = "Fila " . ($index + 2) . ": CoResponsable no encontrado ({$name}).";
                    if ($fallbackMemberId) {
                        $assignStmt->execute([$taskId, $fallbackMemberId]);
                    }
                }
            }
        }

        foreach ($extraMemberIds as $memberId) {
            $assignStmt->execute([$taskId, $memberId]);
        }

        $inserted++;
    }

    $pdo->commit();
    echo json_encode(['inserted' => $inserted, 'warnings' => $warnings]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['error' => $e->getMessage()]);
}

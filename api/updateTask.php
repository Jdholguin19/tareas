<?php
require_once 'config.php';

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];

$id = $_GET['id'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);

if (!$id) {
    echo json_encode(['error' => 'Task ID is required']);
    exit;
}

try {
    // First, get the current task data and verify ownership
    $stmtCurrent = $pdo->prepare("SELECT proyecto_id, creado_por, estado, fecha_vencimiento, fecha_completada FROM tareas WHERE id = ?");
    $stmtCurrent->execute([$id]);
    $currentTask = $stmtCurrent->fetch(PDO::FETCH_ASSOC);

    if (!$currentTask) {
        echo json_encode(['error' => 'Task not found']);
        exit;
    }

    // Verificar que el usuario tenga permisos para editar (creador o asignado)
    $stmtPermisos = $pdo->prepare("
        SELECT 1 FROM tareas t
        WHERE t.id = ? AND (t.creado_por = ? OR EXISTS (
            SELECT 1 FROM tareas_asignados ta WHERE ta.tarea_id = t.id AND ta.usuario_id = ?
        ))
    ");
    $stmtPermisos->execute([$id, $userId, $userId]);
    
    if ($stmtPermisos->rowCount() === 0) {
        echo json_encode(['error' => 'No tienes permiso para modificar esta tarea']);
        exit;
    }

    $fieldMapping = [
        'ID' => 'id',
        'Titulo' => 'titulo',
        'Descripcion' => 'descripcion',
        'Estado' => 'estado',
        'Porcentaje_Avance' => 'progreso',
        'Fecha_Creacion' => 'fecha_creacion',
        'Fecha_Vencimiento' => 'fecha_vencimiento',
        'Fecha_Inicio' => 'fecha_inicio',
        'Fecha_Completada' => 'fecha_completada',
        'Usuario_Creador_ID' => 'creado_por',
        'Usuario_Asignado_ID' => 'asignado_a',
        'Proyecto' => 'proyecto_id',
        'Parent_ID' => 'tarea_padre_id',
        'Adjuntos_URL' => 'adjuntos_url',
        'Prioridad' => 'prioridad',
        'Importancia' => 'importancia'
    ];

    // Auto-set completion/due date when marking as completed
    $markCompleted = false;
    if (isset($data['Estado']) && strtolower(trim($data['Estado'])) === 'completada') {
        $markCompleted = true;
    } elseif (isset($data['Porcentaje_Avance']) && floatval($data['Porcentaje_Avance']) >= 100) {
        $markCompleted = true;
    }

    // Normalize incoming Fecha_Completada when provided; ensure MySQL DATETIME/TIMESTAMP format
    if (isset($data['Fecha_Completada'])) {
        if ($data['Fecha_Completada'] === '' || $data['Fecha_Completada'] === null) {
            $data['Fecha_Completada'] = null;
        } else {
            $ts = strtotime($data['Fecha_Completada']);
            if ($ts !== false) {
                $data['Fecha_Completada'] = date('Y-m-d H:i:s', $ts);
            } else {
                $data['Fecha_Completada'] = null;
            }
        }
    }

    // Normalize date-only fields: Fecha_Inicio and Fecha_Vencimiento
    foreach (['Fecha_Inicio', 'Fecha_Vencimiento'] as $dateField) {
        if (isset($data[$dateField])) {
            if ($data[$dateField] === '' || $data[$dateField] === null || $data[$dateField] === '0000-00-00') {
                $data[$dateField] = null;
            } else {
                $ts = strtotime($data[$dateField]);
                if ($ts !== false) {
                    $data[$dateField] = date('Y-m-d', $ts);
                } else {
                    $data[$dateField] = null;
                }
            }
        }
    }

    if ($markCompleted) {
        // If completion date not provided, set current server datetime (include time)
        if (!isset($data['Fecha_Completada']) || $data['Fecha_Completada'] === null) {
            $data['Fecha_Completada'] = date('Y-m-d H:i:s');
        }
        // Do NOT auto-set Fecha_Vencimiento when marking completed. Keep due date unchanged unless explicitly provided.
        // (Previously defaulted Fecha_Vencimiento to today when completing; removed per UX requirement.)
    }

    $fields = [];
    $values = [];
    foreach ($data as $key => $value) {
        if (isset($fieldMapping[$key])) {
            $dbKey = $fieldMapping[$key];
            if ($key === 'Parent_ID' && $value == 0) {
                $value = NULL;
            }
            if ($key === 'Proyecto') {
                if ($value === null || $value === '') {
                    // Allow setting proyecto_id to NULL
                    $value = NULL;
                } elseif ($value == $currentTask['proyecto_id']) {
                    // Same value, no need to update
                    continue;
                } elseif (!is_numeric($value)) {
                    // Skip invalid values
                    continue;
                } else {
                    // Validate that the project exists
                    $stmtCheck = $pdo->prepare("SELECT id FROM proyectos WHERE id = ?");
                    $stmtCheck->execute([$value]);
                    if ($stmtCheck->rowCount() === 0) {
                        // Project doesn't exist, skip this field
                        continue;
                    }
                }
            }
            if (is_array($value)) {
                $value = json_encode($value);
            }
            $fields[] = "$dbKey = ?";
            $values[] = $value;
        }
    }
    $values[] = $id;

    $stmt = $pdo->prepare("UPDATE tareas SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);

    $stmt = $pdo->prepare("
        SELECT 
            t.id AS ID,
            t.titulo AS Titulo,
            t.descripcion AS Descripcion,
            t.estado AS Estado,
            t.progreso AS Porcentaje_Avance,
            t.fecha_creacion AS Fecha_Creacion,
            t.fecha_vencimiento AS Fecha_Vencimiento,
            t.fecha_inicio AS Fecha_Inicio,
            t.fecha_completada AS Fecha_Completada,
            t.creado_por AS Usuario_Creador_ID,
            t.asignado_a AS Usuario_Asignado_ID,
            t.proyecto_id AS Proyecto,
            t.tarea_padre_id AS Parent_ID,
            t.adjuntos_url AS Adjuntos_URL,
            t.tipos_tareas_id AS Tipos_Tareas_ID,
            t.prioridad AS Prioridad,
            t.importancia AS Importancia,
            p.nombre AS proyecto_nombre
        FROM tareas t
        LEFT JOIN proyectos p ON t.proyecto_id = p.id
        WHERE t.id = ?
    ");
    $stmt->execute([$id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $task['Adjuntos_URL'] = json_decode($task['Adjuntos_URL'] ?? '[]', true);

    // If the task was just marked as completed and it has assignees, send an email to the creator
    if ($markCompleted) {
        // Fetch assignees for this task (include id to compare with current user)
        $stmtAssignees = $pdo->prepare("SELECT u.id, u.username, u.email FROM tareas_asignados ta JOIN usuarios u ON ta.usuario_id = u.id WHERE ta.tarea_id = ?");
        $stmtAssignees->execute([$id]);
        $assignees = $stmtAssignees->fetchAll(PDO::FETCH_ASSOC);

        if (count($assignees) > 0) {
            // Fetch creator info
            $creatorId = $task['Usuario_Creador_ID'];
            $stmtCreator = $pdo->prepare("SELECT username, email FROM usuarios WHERE id = ?");
            $stmtCreator->execute([$creatorId]);
            $creator = $stmtCreator->fetch(PDO::FETCH_ASSOC);

            // Only send email when the user who completed the task is one of the assignees
            // AND the creator is different from that assignee (i.e. someone else assigned it to them)
            $assigneeIds = array_map(function($a){ return intval($a['id']); }, $assignees);
            $currentUserId = intval($userId);
            $creatorIdInt = intval($creatorId);

            if (in_array($currentUserId, $assigneeIds) && $creatorIdInt !== $currentUserId) {
                if ($creator && !empty($creator['email'])) {
                // Build email body
                $assignedNames = array_map(function($a){ return $a['username']; }, $assignees);
                $assignedStr = implode(', ', $assignedNames);

                $subject = "Tarea completada: " . ($task['Titulo'] ?? 'Tarea');
                $fecha_inicio = $task['Fecha_Inicio'] ?? 'N/A';
                $fecha_fin = $task['Fecha_Vencimiento'] ?? 'N/A';
                $fecha_completada = $task['Fecha_Completada'] ?? date('Y-m-d H:i:s');

                $body = "<html><body>";
                $body .= "<div style='font-family: Arial, Helvetica, sans-serif; color:#222;'>";
                $body .= "<h2 style='color:#0f172a'>Notificación: Se ha completadado una tarea asignada</h2>";
                $body .= "<table style='width:100%; border-collapse:collapse;'>";
                $body .= "<tr><td style='padding:6px;border:1px solid #eee;'><strong>Título</strong></td><td style='padding:6px;border:1px solid #eee;'>" . htmlspecialchars($task['Titulo']) . "</td></tr>";
                $body .= "<tr><td style='padding:6px;border:1px solid #eee;'><strong>Fecha inicio</strong></td><td style='padding:6px;border:1px solid #eee;'>" . htmlspecialchars($fecha_inicio) . "</td></tr>";
                $body .= "<tr><td style='padding:6px;border:1px solid #eee;'><strong>Fecha fin</strong></td><td style='padding:6px;border:1px solid #eee;'>" . htmlspecialchars($fecha_fin) . "</td></tr>";
                $body .= "<tr><td style='padding:6px;border:1px solid #eee;'><strong>Fecha completada</strong></td><td style='padding:6px;border:1px solid #eee;'>" . htmlspecialchars($fecha_completada) . "</td></tr>";
                $body .= "<tr><td style='padding:6px;border:1px solid #eee;'><strong>Asignado/s</strong></td><td style='padding:6px;border:1px solid #eee;'>" . htmlspecialchars($assignedStr) . "</td></tr>";
                $body .= "</table>";
                $body .= "<p style='margin-top:12px;color:#555;'>La tarea asignada se ha marcado como completada.</p>";
                $body .= "<p style='font-size:12px;color:#888;'>Este es un mensaje automático.</p>";
                $body .= "</div></body></html>";

                // Use centralized EmailHelper (Microsoft Graph)
                require_once __DIR__ . '/../email/EmailHelper.php';

                // Use the tenant/app credentials (adapted from existing implementation)
                $tenantId = getenv('AZURE_TENANT_ID') ?: '';
                $clientId = getenv('AZURE_CLIENT_ID') ?: '';
                $clientSecret = getenv('AZURE_CLIENT_SECRET') ?: '';
                $fromEmail = getenv('NOTIFICATION_FROM_EMAIL') ?: 'no-replay@thaliavictoria.com.ec';

                $tokenResp = getAccessToken($tenantId, $clientId, $clientSecret);
                if (isset($tokenResp['access_token'])) {
                    $accessToken = $tokenResp['access_token'];
                    $sendRes = sendEmail($accessToken, $fromEmail, $creator['email'], $subject, $body);
                    // Optionally log errors
                    if (isset($sendRes['error'])) {
                        error_log("Failed to send completion email for task $id: " . $sendRes['error']);
                    }
                } else {
                    error_log('Failed to obtain access token: ' . json_encode($tokenResp));
                }
            }
        }}
    }

    // Trigger metrics sync: notify Metrics app that this Planics task was completed.
    try {
        // Build sync URL to metrics endpoint. Use current host as base.
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? '127.0.0.1';
        $syncUrl = $scheme . '://' . $host . '/api/metrics/sync/sync_from_planics.php?planics_task_id=' . urlencode($id);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $syncUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        // Optional: don't verify SSL if running locally
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $resp = curl_exec($ch);
        if ($resp === false) {
            error_log('sync_from_planics request failed: ' . curl_error($ch));
        } else {
            // log short response for traceability
            error_log('sync_from_planics response: ' . substr($resp, 0, 400));
        }
        curl_close($ch);
    } catch (Throwable $e) {
        error_log('sync_from_planics exception: ' . $e->getMessage());
    }

    echo json_encode($task);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

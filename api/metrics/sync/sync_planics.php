<?php
declare(strict_types=1);

// Planics connector: funciones reutilizables para sincronizar compromisos como tareas
// No enviar headers ni responder directamente desde este módulo; exporta funciones.
/**
 * Minimal Planics connector
 *
 * Este archivo mantiene solo lo necesario para conectar a la BD de Planics
 * y proporciona funciones de ejemplo para crear tareas usando el email
 * como llave para mapear usuarios.
 *
 * Uso: incluir este archivo y llamar a create_planics_task(...) desde
 * el código que crea compromisos en esta aplicación.
 */

require_once __DIR__ . '/../db_users.php';

// Obtener conexión a Planics
$pdo_users = DBUsers::getDB();

// Valor por defecto: usar project id forzado si no se especifica (puedes sobreescribir con PLANICS_DEFAULT_PROJECT_ID env)
$DEFAULT_PLANICS_PROJECT_ID = getenv('PLANICS_DEFAULT_PROJECT_ID') !== false ? (int)getenv('PLANICS_DEFAULT_PROJECT_ID') : 42;

// Busca usuario de Planics por email, devuelve id o null
function planics_find_user_by_email(PDO $pdo_users, string $email): ?int {
    $stmt = $pdo_users->prepare('SELECT id FROM usuarios WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) return (int)$row['id'];

    // Si no existe, opcionalmente crear usuario si la variable de entorno lo permite
    $autoCreate = getenv('PLANICS_CREATE_USERS');
    if ($autoCreate !== false && in_array(strtolower($autoCreate), ['1','true','yes'])) {
        return planics_create_user_by_email($pdo_users, $email);
    }

    return null;
}


// Busca o crea proyecto en Planics por nombre, devuelve proyecto_id
function planics_get_or_create_project(PDO $pdo_users, string $projectName, ?int $managerId = null): int {
    $stmt = $pdo_users->prepare('SELECT id FROM proyectos WHERE nombre = :nombre LIMIT 1');
    $stmt->execute(['nombre' => $projectName]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) return (int)$row['id'];

    $stmt = $pdo_users->prepare("INSERT INTO proyectos (nombre, manager_id, estado) VALUES (:nombre, :manager_id, 'activo')");
    $stmt->execute(['nombre' => $projectName, 'manager_id' => $managerId]);
    return (int)$pdo_users->lastInsertId();
}

// Crea una tarea en Planics. Parámetros básicos: título, creadorEmail, assigneeEmail opcional, dueDate opcional, projectName opcional
function create_planics_task(PDO $pdo_users, string $title, string $creatorEmail, ?string $assigneeEmail = null, ?string $dueDate = null, string $projectName = 'Default', ?int $forceProjectId = null) {
    // Mapear creador y assignee
    $creatorId = planics_find_user_by_email($pdo_users, $creatorEmail);
    $assigneeId = $assigneeEmail ? planics_find_user_by_email($pdo_users, $assigneeEmail) : null;

    // Obtener project id: prioridad param $forceProjectId > ENV DEFAULT > crear/obtener por nombre
    if ($forceProjectId !== null) {
        $projectId = (int)$forceProjectId;
    } else {
        $envDefault = getenv('PLANICS_DEFAULT_PROJECT_ID');
        if ($envDefault !== false) {
            // Si hay default en env, usarlo y NO crear proyectos
            $projectId = (int)$envDefault;
        } else {
            $projectId = planics_get_or_create_project($pdo_users, $projectName, $creatorId);
        }
    }

    // Insertar tarea (si no existe una con mismo título + creador)
    $check = $pdo_users->prepare('SELECT id FROM tareas WHERE titulo = :titulo AND creado_por = :creado_por AND proyecto_id = :proyecto_id LIMIT 1');
    $check->execute(['titulo' => $title, 'creado_por' => $creatorId ?? 0, 'proyecto_id' => $projectId]);
    if ($check->fetch(PDO::FETCH_ASSOC)) {
        return ['ok' => true, 'message' => 'task exists'];
    }

    $insert = $pdo_users->prepare('INSERT INTO tareas (titulo, creado_por, fecha_vencimiento, estado, proyecto_id, tipos_tareas_id) VALUES (:titulo, :creado_por, :fecha_vencimiento, "pendiente", :proyecto_id, 1)');
    $insert->execute([
        'titulo' => $title,
        'creado_por' => $creatorId ?? 0,
        'fecha_vencimiento' => $dueDate,
        'proyecto_id' => $projectId
    ]);
    $taskId = (int)$pdo_users->lastInsertId();

    if ($assigneeId) {
        $assign = $pdo_users->prepare('INSERT INTO tareas_asignados (tarea_id, usuario_id, fecha_asignacion) VALUES (:tarea_id, :usuario_id, NOW())');
        $assign->execute(['tarea_id' => $taskId, 'usuario_id' => $assigneeId]);
    }

    return ['ok' => true, 'task_id' => $taskId];
}

// Ejemplo de uso (comentado):
// $res = create_planics_task($pdo_users, 'Título de tarea', 'autor@empresa.com', 'destinatario@empresa.com', '2025-12-31', 'Reunión Equipo');
// var_export($res);

// Sincronizar un compromiso por su ID: toma datos desde la BD de la aplicación
function sync_compromiso_to_planics(PDO $appDb, string $compromisoId): array {
    $enabled = getenv('PLANICS_SYNC_ENABLED');
    if ($enabled !== false && in_array(strtolower($enabled), ['0','false','no'])) {
        return ['ok' => true, 'skipped' => true, 'message' => 'Planics sync disabled by env'];
    }

    // Cargar compromiso
    $stmt = $appDb->prepare('SELECT * FROM compromisos WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $compromisoId]);
    $c = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$c) return ['ok' => false, 'message' => 'Compromiso not found'];

    // Resolver emails: creador y responsable
    $creatorEmail = null;
    $responsibleEmail = null;

    // creador: buscar en users -> profiles
    $stmtC = $appDb->prepare('SELECT email FROM users WHERE id = :id LIMIT 1');
    $stmtC->execute([':id' => $c['creado_por']]);
    $rowC = $stmtC->fetch(PDO::FETCH_ASSOC);
    if ($rowC && !empty($rowC['email'])) $creatorEmail = $rowC['email'];
    else {
        $stmtC = $appDb->prepare('SELECT email FROM profiles WHERE id = :id LIMIT 1');
        $stmtC->execute([':id' => $c['creado_por']]);
        $rowC = $stmtC->fetch(PDO::FETCH_ASSOC);
        if ($rowC && !empty($rowC['email'])) $creatorEmail = $rowC['email'];
    }

    // responsable user_id
    $stmtR = $appDb->prepare('SELECT email FROM users WHERE id = :id LIMIT 1');
    $stmtR->execute([':id' => $c['user_id']]);
    $rowR = $stmtR->fetch(PDO::FETCH_ASSOC);
    if ($rowR && !empty($rowR['email'])) $responsibleEmail = $rowR['email'];
    else {
        $stmtR = $appDb->prepare('SELECT email FROM profiles WHERE id = :id LIMIT 1');
        $stmtR->execute([':id' => $c['user_id']]);
        $rowR = $stmtR->fetch(PDO::FETCH_ASSOC);
        if ($rowR && !empty($rowR['email'])) $responsibleEmail = $rowR['email'];
    }

    // Preparar título y proyecto
    $projectName = $c['tipo'] === 'ventaja_ganadora' ? 'Compromisos VG' : 'Compromisos RAP';
    $titlePrefix = $c['tipo'] === 'ventaja_ganadora' ? 'Compromiso VG:' : 'Compromiso RAP:';
    $taskTitle = trim($titlePrefix . ' ' . ($c['descripcion'] ?? ''));

    // Ejecutar sincronización
    $pdo_users = DBUsers::getDB();
    try {
        // Usar project id forzado desde ENV o valor por defecto (42)
        $forcedPid = getenv('PLANICS_DEFAULT_PROJECT_ID') !== false ? (int)getenv('PLANICS_DEFAULT_PROJECT_ID') : 42;

        // Si es VG, adjuntar la descripción de la solución propuesta al título si existe
        if (!empty($c['tipo']) && $c['tipo'] === 'ventaja_ganadora' && !empty($c['ventaja_ganadora_id'])) {
            try {
                $stmtSol = $appDb->prepare('SELECT descripcion FROM vg_soluciones WHERE ventaja_ganadora_id = :vg_id AND estado = :estado ORDER BY created_at DESC LIMIT 1');
                $stmtSol->execute([':vg_id' => $c['ventaja_ganadora_id'], ':estado' => 'solucion']);
                $sol = $stmtSol->fetch(PDO::FETCH_ASSOC);
                if ($sol && !empty($sol['descripcion'])) {
                    $taskTitle .= "\n\nSolucion de la VG: " . trim($sol['descripcion']);
                }
            } catch (Throwable $e) {
                error_log('sync_compromiso_to_planics - error fetching solution: ' . $e->getMessage());
            }
        }

        $result = create_planics_task($pdo_users, $taskTitle, $creatorEmail ?? '', $responsibleEmail, $c['fecha_compromiso'] ?? null, $projectName, $forcedPid);
        return ['ok' => true, 'planics' => $result];
    } catch (Throwable $e) {
        error_log('sync_compromiso_to_planics error: ' . $e->getMessage());
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}

// ----- Nueva función: cuando una tarea en Planics se marca como completada,
// sincronizar el compromiso correspondiente en Metrics (si se encuentra).
function sync_planics_task_completion_to_metrics(PDO $metricsDb, PDO $planicsDb, int $planicsTaskId): array {
    try {
        // Obtener la tarea desde Planics
        $stmt = $planicsDb->prepare('SELECT id, titulo, estado, proyecto_id FROM tareas WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $planicsTaskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$task) return ['ok' => false, 'message' => 'Planics task not found'];

        // Verificar que la tarea pertenezca al proyecto que monitorizamos (env PLANICS_DEFAULT_PROJECT_ID o 42)
        $expectedProjectId = getenv('PLANICS_DEFAULT_PROJECT_ID') !== false ? (int)getenv('PLANICS_DEFAULT_PROJECT_ID') : 42;
        if (!empty($task['proyecto_id']) && (int)$task['proyecto_id'] !== $expectedProjectId) {
            return ['ok' => true, 'skipped' => true, 'message' => 'Task project not monitored', 'project_id' => $task['proyecto_id']];
        }

        // Solo procesar si el estado sugiere completado
        $estado = strtolower(trim((string)$task['estado']));
        if (strpos($estado, 'complet') === false && strpos($estado, 'done') === false && strpos($estado, 'finaliz') === false) {
            return ['ok' => true, 'skipped' => true, 'message' => 'Task not completed'];
        }

        $titulo = (string)$task['titulo'];

        // Normalizar título: remover prefijos usados al crear desde Metrics
        $norm = preg_replace('/^\s*Compromiso\s+VG:\s*/i', '', $titulo);
        $norm = preg_replace('/^\s*Compromiso\s+RAP:\s*/i', '', $norm);
        // Eliminar secciones de "Solucion de la VG:" añadidas
        $norm = preg_replace('/\n\s*Solucion de la VG:.*$/is', '', $norm);
        $norm = trim($norm);

        // Determinar tipo probable
        $tipo = null;
        if (preg_match('/^\s*Compromiso\s+VG:/i', $titulo)) $tipo = 'ventaja_ganadora';
        else if (preg_match('/^\s*Compromiso\s+RAP:/i', $titulo)) $tipo = 'rap';

        // Buscar compromiso en Metrics por descripcion aproximada y (si posible) tipo
        $params = [':desc' => '%' . mb_substr($norm, 0, 120) . '%'];
        $sql = 'SELECT * FROM compromisos WHERE descripcion LIKE :desc AND estado <> :completed';
        $params[':completed'] = 'completado';

        if ($tipo) {
            $sql .= ' AND tipo = :tipo';
            $params[':tipo'] = $tipo;
        }

        $sql .= ' ORDER BY fecha_compromiso ASC, fecha_creacion DESC LIMIT 1';
        $stmt2 = $metricsDb->prepare($sql);
        $stmt2->execute($params);
        $comp = $stmt2->fetch(PDO::FETCH_ASSOC);
        if (!$comp) {
            // If not found with tipo filter, try without tipo
            if ($tipo) {
                $stmt3 = $metricsDb->prepare('SELECT * FROM compromisos WHERE descripcion LIKE :desc AND estado <> :completed ORDER BY fecha_compromiso ASC, fecha_creacion DESC LIMIT 1');
                $stmt3->execute([':desc' => $params[':desc'], ':completed' => 'completado']);
                $comp = $stmt3->fetch(PDO::FETCH_ASSOC);
            }
        }

        if (!$comp) return ['ok' => false, 'message' => 'No matching compromiso found'];

        // Actualizar compromiso como completado
        $update = $metricsDb->prepare('UPDATE compromisos SET estado = :estado, fecha_cumplimiento = CURDATE() WHERE id = :id');
        $update->execute([':estado' => 'completado', ':id' => $comp['id']]);

        return ['ok' => true, 'metrics_compromiso_id' => $comp['id'], 'planics_task_id' => $planicsTaskId];
    } catch (Throwable $e) {
        error_log('sync_planics_task_completion_to_metrics error: ' . $e->getMessage());
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}


<?php
require_once 'config.php';

try {
    // Verificar que el usuario esté autenticado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }

    $currentUserId = $_SESSION['user_id'];

    // Obtener información del usuario actual
    $stmt = $pdo->prepare("
        SELECT id, username, email, departamento_id, rol_id 
        FROM usuarios 
        WHERE id = ?
    ");
    $stmt->execute([$currentUserId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuario no encontrado']);
        exit();
    }

    $users = [];

    // Si es admin (rol_id = 2), puede ver TODOS los usuarios
    if ($currentUser['rol_id'] == 2) {
        $stmt = $pdo->prepare("
            SELECT 
                u.id,
                u.username,
                u.email,
                u.departamento_id,
                u.rol_id,
                (
                    SELECT GROUP_CONCAT(d2.nombre SEPARATOR ', ')
                    FROM usuario_departamentos ud2
                    INNER JOIN departamentos d2 ON ud2.departamento_id = d2.id
                    WHERE ud2.usuario_id = u.id
                ) as departamento_nombre
            FROM usuarios u
            WHERE u.estado = 'activo'
            ORDER BY u.username ASC
        ");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // No es admin, obtener TODOS los departamentos del usuario actual
        $stmt = $pdo->prepare("
            SELECT departamento_id 
            FROM usuario_departamentos 
            WHERE usuario_id = ?
        ");
        $stmt->execute([$currentUserId]);
        $userDepartments = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // También verificar si es manager de algún departamento
        $stmt = $pdo->prepare("
            SELECT id 
            FROM departamentos 
            WHERE manager_id = ?
        ");
        $stmt->execute([$currentUserId]);
        $managedDepartments = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Combinar departamentos del usuario + departamentos que gestiona
        $allDeptIds = array_unique(array_merge($userDepartments, $managedDepartments));

        if (count($allDeptIds) > 0) {
            // Obtener usuarios de TODOS los departamentos (propios + gestionados)
            $placeholders = str_repeat('?,', count($allDeptIds) - 1) . '?';
            
            // Usar DISTINCT porque un usuario puede estar en múltiples departamentos
            $stmt = $pdo->prepare("
                SELECT DISTINCT
                    u.id,
                    u.username,
                    u.email,
                    u.departamento_id,
                    u.rol_id,
                    (
                        SELECT GROUP_CONCAT(d2.nombre SEPARATOR ', ')
                        FROM usuario_departamentos ud2
                        INNER JOIN departamentos d2 ON ud2.departamento_id = d2.id
                        WHERE ud2.usuario_id = u.id
                    ) as departamento_nombre
                FROM usuarios u
                INNER JOIN usuario_departamentos ud ON u.id = ud.usuario_id
                WHERE ud.departamento_id IN ($placeholders) 
                AND u.estado = 'activo'
                ORDER BY u.username ASC
            ");
            $stmt->execute($allDeptIds);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            // Usuario sin departamentos - solo puede verse a sí mismo
            $users = [
                [
                    'id' => $currentUser['id'],
                    'username' => $currentUser['username'],
                    'email' => $currentUser['email'],
                    'departamento_id' => null,
                    'rol_id' => $currentUser['rol_id'],
                    'departamento_nombre' => null
                ]
            ];
        }
    }

    echo json_encode($users);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener usuarios: ' . $e->getMessage()]);
}
?>

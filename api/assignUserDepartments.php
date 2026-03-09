<?php
require_once 'config.php';

try {
    // Verificar que el usuario esté autenticado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }

    // Verificar que el usuario sea admin
    $userStmt = $pdo->prepare("SELECT rol_id FROM usuarios WHERE id = ?");
    $userStmt->execute([$_SESSION['user_id']]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['rol_id'] != 2) {
        http_response_code(403);
        echo json_encode(['error' => 'No tienes permisos de administrador']);
        exit();
    }

    // Obtener datos del POST
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['usuario_id'] ?? null;
    $departmentIds = $data['departamento_ids'] ?? [];

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'El ID de usuario es requerido']);
        exit();
    }

    $pdo->beginTransaction();

    // Eliminar asignaciones existentes
    $stmt = $pdo->prepare("DELETE FROM usuario_departamentos WHERE usuario_id = ?");
    $stmt->execute([$userId]);

    // Insertar nuevas asignaciones
    if (!empty($departmentIds)) {
        $stmt = $pdo->prepare("INSERT INTO usuario_departamentos (usuario_id, departamento_id) VALUES (?, ?)");
        
        foreach ($departmentIds as $deptId) {
            $stmt->execute([$userId, $deptId]);
        }

        // Actualizar el departamento principal (el primero) en la tabla usuarios para compatibilidad
        $mainDeptStmt = $pdo->prepare("UPDATE usuarios SET departamento_id = ? WHERE id = ?");
        $mainDeptStmt->execute([$departmentIds[0], $userId]);
    } else {
        // Si no se seleccionó ningún departamento, poner NULL
        $mainDeptStmt = $pdo->prepare("UPDATE usuarios SET departamento_id = NULL WHERE id = ?");
        $mainDeptStmt->execute([$userId]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Departamentos asignados correctamente']);

} catch (PDOException $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Error al asignar departamentos: ' . $e->getMessage()]);
}
?>

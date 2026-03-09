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
    $userId = $data['user_id'] ?? null;
    $departmentIds = $data['department_ids'] ?? [];

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'El ID de usuario es requerido']);
        exit();
    }

    // Iniciar transacción
    $pdo->beginTransaction();

    try {
        // Eliminar asignaciones existentes
        $deleteStmt = $pdo->prepare("DELETE FROM usuario_departamentos WHERE usuario_id = ?");
        $deleteStmt->execute([$userId]);

        // Insertar nuevas asignaciones
        if (!empty($departmentIds)) {
            $insertStmt = $pdo->prepare("INSERT INTO usuario_departamentos (usuario_id, departamento_id) VALUES (?, ?)");
            
            foreach ($departmentIds as $deptId) {
                $insertStmt->execute([$userId, $deptId]);
            }

            // Actualizar departamento_id principal (el primero) en usuarios por compatibilidad
            $updateStmt = $pdo->prepare("UPDATE usuarios SET departamento_id = ? WHERE id = ?");
            $updateStmt->execute([$departmentIds[0], $userId]);
        } else {
            // Si no hay departamentos, limpiar el campo en usuarios
            $updateStmt = $pdo->prepare("UPDATE usuarios SET departamento_id = NULL WHERE id = ?");
            $updateStmt->execute([$userId]);
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Departamentos asignados correctamente']);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al asignar usuario: ' . $e->getMessage()]);
}
?>

<?php
require_once '../config/db.php';
require_once '../config/db_users.php';
require_once '../email/EmailHelper.php';

header('Content-Type: application/json');

// Configuración de credenciales
$tenantId = '';
$clientId = '';
$clientSecret = '';
$fromEmail = '';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $meetingId = $input['meeting_id'] ?? null;
    $recipients = $input['recipients'] ?? [];
    $pdfBase64 = $input['pdf_base64'] ?? null;
    $subject = $input['subject'] ?? null;
    $requester_id = $input['requester_id'] ?? null;
    
    if (!$meetingId || empty($recipients) || !$pdfBase64 || !$subject) {
        throw new Exception('Faltan datos requeridos');
    }
    
    // Obtener datos de la reunión
    $stmt = $pdo->prepare("
        SELECT m.*, mt.name as meeting_type_name 
        FROM meetings m 
        LEFT JOIN meeting_types mt ON m.meeting_type_id = mt.id 
        WHERE m.id = ?
    ");
    $stmt->execute([$meetingId]);
    $meeting = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$meeting) {
        throw new Exception('Reunión no encontrada');
    }
    // Validar que requester sea el creador de la reunión
    if ($requester_id === null || intval($requester_id) !== intval($meeting['user_id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Permisos insuficientes: solo el creador puede enviar correos']);
        exit;
    }
    
    // Obtener participantes con sus emails desde la base de datos de usuarios
    $stmt = $pdo->prepare("
        SELECT mp.user_id
        FROM meeting_participants mp
        WHERE mp.meeting_id = ?
    ");
    $stmt->execute([$meetingId]);
    $participantIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $participantsData = [];
    
    if (!empty($participantIds)) {
        $placeholders = implode(',', array_fill(0, count($participantIds), '?'));
        
        // Obtener datos de usuarios desde db_users
        $stmt_users = $pdo_users->prepare("
            SELECT id, username, email
            FROM usuarios
            WHERE id IN ($placeholders)
        ");
        $stmt_users->execute($participantIds);
        $usersData = $stmt_users->fetchAll(PDO::FETCH_ASSOC);
        
        // Crear un mapa de usuarios por ID
        $usersMap = [];
        foreach ($usersData as $user) {
            $usersMap[$user['id']] = $user;
        }
        
        // Obtener tareas asignadas a cada usuario
        $stmt_tasks = $pdo->prepare("
            SELECT assignee, 
                   GROUP_CONCAT(CONCAT(title, ' - <b>Fecha compromiso</b> - ', DATE_FORMAT(due_date, '%d/%m/%Y')) SEPARATOR '|||') as tasks
            FROM meeting_tasks
            WHERE meeting_id = ? AND assignee IS NOT NULL
            GROUP BY assignee
        ");
        $stmt_tasks->execute([$meetingId]);
        $tasksData = $stmt_tasks->fetchAll(PDO::FETCH_ASSOC);
        
        // Crear un mapa de tareas por username
        $tasksMap = [];
        foreach ($tasksData as $taskRow) {
            $tasksMap[$taskRow['assignee']] = $taskRow['tasks'];
        }
        
        // Combinar datos de usuarios con sus tareas
        foreach ($usersData as $user) {
            $participantsData[] = [
                'username' => $user['username'],
                'email' => $user['email'],
                'tasks' => $tasksMap[$user['username']] ?? null
            ];
        }
    }
    
    // Obtener token de acceso
    $tokenResponse = getAccessToken($tenantId, $clientId, $clientSecret);
    if (isset($tokenResponse['error'])) {
        throw new Exception('Error al obtener token: ' . $tokenResponse['error']);
    }
    
    $accessToken = $tokenResponse['access_token'];
    
    $successCount = 0;
    $errors = [];
    
    // Enviar UN SOLO correo con el acta a TODOS los destinatarios (primer destinatario en To, resto en Bcc)
    if (!empty($recipients)) {
        $emailBody = "
            <p>Estimado/a,</p>
            <p>Adjunto encontrará el acta de la reunión: <strong>{$meeting['title']}</strong></p>
            <p>Fecha: " . date('d/m/Y', strtotime($meeting['created_at'])) . "</p>
            <p>Por favor, revise el documento adjunto para conocer los detalles y acuerdos de la reunión.</p>
            <br>
            <p>Atentamente,</p>
            <p><strong>Sistema de Gestión de Reuniones</strong></p>
            <br><br>
            <p style='color: #666; font-size: 12px;'>* No responder a este correo, es enviado automáticamente *</p>
        ";

        // Build to + bcc lists: prefer organizer as To; others in Bcc
        $organizer_email = null;
        if (!empty($meeting['user_id'])) {
            try {
                $stmtOrg = $pdo_users->prepare("SELECT email FROM usuarios WHERE id = ? LIMIT 1");
                $stmtOrg->execute([$meeting['user_id']]);
                $organizer_email = $stmtOrg->fetchColumn() ?: null;
            } catch (Exception $e) {
                $organizer_email = null;
            }
        }

        if ($organizer_email) {
            $to = [$organizer_email];
            // Bcc: all recipients except the organizer (deduplicated)
            $bcc = array_values(array_unique(array_filter($recipients, function($r) use ($organizer_email) {
                return strcasecmp(trim($r), trim($organizer_email)) !== 0;
            })));
        } else {
            $to = [$recipients[0]];
            $bcc = array_slice($recipients, 1);
        }

        $result = sendEmailWithAttachmentBulk($accessToken, $fromEmail, $to, $bcc, $subject, $emailBody, $pdfBase64, 'Acta_Reunion.pdf');
        if (isset($result['error'])) {
            $errors[] = "Error enviando acta: " . $result['error'];
        } else {
            $successCount++;
        }
    }
    
    // Enviar correos individuales con tareas asignadas
    if (!empty($participantsData)) {
        foreach ($participantsData as $participant) {
            if (!empty($participant['email']) && !empty($participant['tasks'])) {
                $tasks = explode('|||', $participant['tasks']);
                $tasksList = '';
                foreach ($tasks as $task) {
                    if (!empty($task) && $task !== ' - ') {
                        $tasksList .= "<li>$task</li>";
                    }
                }
                
                if (!empty($tasksList)) {
                    $taskEmailBody = "
                        <p>Estimado/a {$participant['username']},</p>
                        <p>En la reunión <strong>{$meeting['title']}</strong>, se le asignaron las siguientes tareas:</p>
                        <ul>
                            $tasksList
                        </ul>
                        <p>Agradecemos su cumplimiento. Por favor, revise <a href='https://planics.costasol.com.ec/'>PlanicsCS</a> para verificar sus tareas asignadas.</p>
                        <br>
                        <p>Atentamente,</p>
                        <p><strong>Sistema de Gestión de Reuniones</strong></p>
                        <br><br>
                        <p style='color: #666; font-size: 12px;'>* No responder a este correo, es enviado automáticamente *</p>
                    ";
                    
                    $taskSubject = "Tareas asignadas - {$meeting['title']}";
                    $result = sendEmail($accessToken, $fromEmail, $participant['email'], $taskSubject, $taskEmailBody);
                    
                    if (isset($result['error'])) {
                        $errors[] = "Error enviando tareas a {$participant['email']}: " . $result['error'];
                    } else {
                        $successCount++;
                    }
                }
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Se enviaron $successCount correos exitosamente",
        'errors' => $errors
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function sendEmailWithAttachment($accessToken, $fromEmail, $toEmail, $subject, $body, $base64Content, $fileName) {
    $url = "https://graph.microsoft.com/v1.0/users/$fromEmail/sendMail";
    $headers = [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ];
    
    $emailData = [
        "message" => [
            "subject" => $subject,
            "body" => [
                "contentType" => "HTML",
                "content" => $body
            ],
            "toRecipients" => [
                [
                    "emailAddress" => [
                        "address" => $toEmail
                    ]
                ]
            ],
            "attachments" => [
                [
                    "@odata.type" => "#microsoft.graph.fileAttachment",
                    "name" => $fileName,
                    "contentType" => "application/pdf",
                    "contentBytes" => $base64Content
                ]
            ]
        ]
    ];
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => json_encode($emailData),
            'ignore_errors' => true
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        $error = error_get_last();
        return ['error' => 'Error de conexión: ' . $error['message']];
    }
    
    $responseData = json_decode($response, true);
    if (isset($responseData['error'])) {
        return ['error' => 'Error en respuesta: ' . json_encode($responseData)];
    }
    
    return ['success' => 'Correo enviado exitosamente'];
}

function sendEmailWithAttachmentBulk($accessToken, $fromEmail, $toEmails, $bccEmails, $subject, $body, $base64Content, $fileName) {
    $url = "https://graph.microsoft.com/v1.0/users/$fromEmail/sendMail";
    $headers = [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ];

    $toRecipients = [];
    foreach ($toEmails as $addr) {
        $toRecipients[] = [
            'emailAddress' => ['address' => $addr]
        ];
    }

    $bccRecipients = [];
    foreach ($bccEmails as $addr) {
        $bccRecipients[] = [
            'emailAddress' => ['address' => $addr]
        ];
    }

    $emailData = [
        "message" => [
            "subject" => $subject,
            "body" => [
                "contentType" => "HTML",
                "content" => $body
            ],
            "toRecipients" => $toRecipients,
            "bccRecipients" => $bccRecipients,
            "attachments" => [
                [
                    "@odata.type" => "#microsoft.graph.fileAttachment",
                    "name" => $fileName,
                    "contentType" => "application/pdf",
                    "contentBytes" => $base64Content
                ]
            ]
        ]
    ];

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => json_encode($emailData),
            'ignore_errors' => true
        ]
    ]);

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        $error = error_get_last();
        return ['error' => 'Error de conexión: ' . $error['message']];
    }

    $responseData = json_decode($response, true);
    if (isset($responseData['error'])) {
        return ['error' => 'Error en respuesta: ' . json_encode($responseData)];
    }

    return ['success' => 'Correo enviado exitosamente'];
}
?>

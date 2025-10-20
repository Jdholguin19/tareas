<?php
require_once 'config.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

$openaiKey = getenv('OPENAI_API_KEY');

if (!$openaiKey) {
    echo json_encode(['error' => 'OpenAI API key not configured']);
    exit;
}

// Verificar que se subió un archivo
if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'No se recibió archivo de audio o hubo un error en la carga']);
    exit;
}

$audioFile = $_FILES['audio'];

// Validar tipo de archivo
$allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/ogg'];
if (!in_array($audioFile['type'], $allowedTypes)) {
    echo json_encode(['error' => 'Tipo de archivo no soportado. Use WebM, WAV, MP3, M4A u OGG']);
    exit;
}

// Validar tamaño (máximo 25MB como recomienda OpenAI)
$maxSize = 25 * 1024 * 1024; // 25MB
if ($audioFile['size'] > $maxSize) {
    echo json_encode(['error' => 'El archivo es demasiado grande. Máximo 25MB']);
    exit;
}

try {
    // Crear archivo temporal con la extensión correcta
    $tmpFilePath = $audioFile['tmp_name'];
    
    // PASO 1: Transcribir con Whisper
    $curl = curl_init();
    
    $postFields = [
        'file' => new CURLFile($tmpFilePath, $audioFile['type'], $audioFile['name']),
        'model' => 'whisper-1',
        'language' => 'es', // Español
        'response_format' => 'json',
        'prompt' => 'Esta es una transcripción de tareas en español ecuatoriano. Por favor, transcribe con puntuación correcta.'
    ];
    
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.openai.com/v1/audio/transcriptions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $openaiKey,
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    
    curl_close($curl);
    
    if ($curlError) {
        throw new Exception('Error en la conexión con OpenAI: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        $errorData = json_decode($response, true);
        $errorMessage = $errorData['error']['message'] ?? 'Error desconocido';
        throw new Exception('OpenAI API error (HTTP ' . $httpCode . '): ' . $errorMessage);
    }
    
    $whisperResult = json_decode($response, true);
    
    if (!isset($whisperResult['text'])) {
        throw new Exception('Respuesta inválida de Whisper');
    }
    
    $rawTranscription = trim($whisperResult['text']);
    
    if (empty($rawTranscription)) {
        echo json_encode(['transcription' => 'No se detectó audio claro. Por favor, intenta de nuevo.']);
        exit;
    }
    
    // PASO 2: Procesar con GPT para extraer tareas
    $curl = curl_init();
    
    $gptPrompt = [
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'Eres un asistente especializado en extraer información de tareas de conversaciones de audio en español ecuatoriano.
Tu tarea es analizar la transcripción completa y extraer ÚNICAMENTE información relevante para crear tareas.

INSTRUCCIONES:
- Identifica menciones específicas de tareas, pendientes, actividades o responsabilidades
- Ignora conversaciones casuales, saludos, despedidas y discusiones irrelevantes
- Presta especial atención a expresiones del español ecuatoriano y flujo conversacional
- Busca frases de transición que introducen tareas: "entonces necesito que", "por cierto no te olvides", "okey entonces", "habría que", "o bien", "ya no sería eso si no", "mejor esto de acá"
- Si se mencionan múltiples tareas, lístalas claramente
- Si no se mencionan tareas claras, indica que no se encontraron tareas específicas
- Mantén el lenguaje natural y conciso en español
- Si alguien asigna una tarea a otra persona, incluye esa información
- Si se mencionan fechas, plazos o prioridades, inclúyelos
- SIEMPRE responde en español para las tareas extraídas

EJEMPLOS:

Entrada: "Hola María, ¿cómo estás? Bien gracias, trabajando. Okey entonces necesito que revises el informe de ventas para mañana. Por cierto no te olvides de comprar los materiales para la reunión."
Salida: "- Revisar el informe de ventas (para mañana)
- Comprar los materiales para la reunión"

Entrada: "Juan, habríamos que cambiar eso o bien apliquemos esos cambios. Ya no sería eso si no mejor esto de acá, ¿no crees?"
Salida: "- Cambiar/aplicar los cambios mencionados
- Revisar la alternativa propuesta"

Entrada: "¿Qué tal el fin de semana? Fue genial, fuimos al cine. Hablamos después."
Salida: "No se encontraron tareas específicas mencionadas."'
            ],
            [
                'role' => 'user',
                'content' => 'Analiza esta transcripción de audio y extrae únicamente las tareas o pendientes mencionados:\n\n"' . $rawTranscription . '"'
            ]
        ],
        'max_tokens' => 500,
        'temperature' => 0.3
    ];
    
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.openai.com/v1/chat/completions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($gptPrompt),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $openaiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $gptResponse = curl_exec($curl);
    $gptHttpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $gptCurlError = curl_error($curl);
    
    curl_close($curl);
    
    // Si GPT falla, devolver la transcripción cruda
    if ($gptCurlError || $gptHttpCode !== 200) {
        error_log('GPT processing failed, returning raw transcription. Error: ' . $gptCurlError);
        echo json_encode(['transcription' => $rawTranscription]);
        exit;
    }
    
    $gptResult = json_decode($gptResponse, true);
    
    if (isset($gptResult['choices'][0]['message']['content'])) {
        $processedTranscription = trim($gptResult['choices'][0]['message']['content']);
        echo json_encode(['transcription' => $processedTranscription]);
    } else {
        // Fallback a transcripción cruda
        echo json_encode(['transcription' => $rawTranscription]);
    }
    
} catch (Exception $e) {
    error_log('Transcription error: ' . $e->getMessage());
    echo json_encode(['error' => 'Error al transcribir: ' . $e->getMessage()]);
}
?>
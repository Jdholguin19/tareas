<?php
require_once 'config.php';

$openaiKey = getenv('OPENAI_API_KEY');

if (!$openaiKey) {
    echo json_encode(['transcription' => 'Error: OpenAI API key not configured']);
    exit;
}

// For simplicity, simulate transcription
// In real implementation, handle file upload and call OpenAI API
echo json_encode(['transcription' => 'Transcripción simulada desde PHP']);
?>
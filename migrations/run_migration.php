<?php
/**
 * Migration Runner Script
 * 
 * Este script ejecuta migraciones SQL en la base de datos.
 * Uso desde terminal:
 * php migrations/run_migration.php <nombre_archivo.sql>
 * 
 * Ejemplo:
 * php migrations/run_migration.php add_importancia_field.sql
 */

// Cargar la configuración de la base de datos
require_once __DIR__ . '/../api/config.php';

// Obtener el nombre del archivo de migración desde argumentos CLI
if ($argc < 2) {
    echo "❌ Error: Debes proporcionar el nombre del archivo de migración.\n";
    echo "Uso: php run_migration.php <nombre_archivo.sql>\n";
    echo "Ejemplo: php run_migration.php add_importancia_field.sql\n";
    exit(1);
}

$migrationFile = $argv[1];
$migrationPath = __DIR__ . '/' . $migrationFile;

// Verificar que el archivo existe
if (!file_exists($migrationPath)) {
    echo "❌ Error: El archivo de migración '$migrationFile' no existe en la carpeta migrations/.\n";
    exit(1);
}

// Leer el contenido del archivo SQL
$sql = file_get_contents($migrationPath);

if ($sql === false) {
    echo "❌ Error: No se pudo leer el archivo de migración.\n";
    exit(1);
}

echo "📋 Ejecutando migración: $migrationFile\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

try {
    // Dividir el SQL en statements individuales (separados por punto y coma)
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            // Ignorar comentarios y líneas vacías
            return !empty($stmt) && 
                   strpos($stmt, '--') !== 0 && 
                   strpos($stmt, '/*') !== 0;
        }
    );

    $successCount = 0;
    $errorCount = 0;

    foreach ($statements as $index => $statement) {
        if (empty($statement)) continue;

        $statementNum = $index + 1;
        echo "▶ Ejecutando statement #$statementNum...\n";
        
        try {
            $pdo->exec($statement);
            echo "✅ Statement #$statementNum ejecutado exitosamente.\n\n";
            $successCount++;
        } catch (PDOException $e) {
            // Si el error es por índice duplicado, lo tratamos como advertencia
            if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "⚠️  Warning en statement #$statementNum: El índice ya existe (ignorado).\n\n";
            } 
            // Si el error es por columna duplicada
            else if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "⚠️  Warning en statement #$statementNum: La columna ya existe (ignorado).\n\n";
            }
            // Otros errores
            else {
                echo "❌ Error en statement #$statementNum:\n";
                echo "   " . $e->getMessage() . "\n\n";
                $errorCount++;
            }
        }
    }

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "📊 Resumen de la migración:\n";
    echo "   ✅ Statements exitosos: $successCount\n";
    if ($errorCount > 0) {
        echo "   ❌ Statements con errores: $errorCount\n";
    }
    echo "\n";

    if ($errorCount === 0) {
        echo "🎉 Migración '$migrationFile' completada exitosamente!\n";
        exit(0);
    } else {
        echo "⚠️  Migración completada con algunos errores. Revisa los mensajes arriba.\n";
        exit(1);
    }

} catch (Exception $e) {
    echo "❌ Error fatal durante la migración:\n";
    echo "   " . $e->getMessage() . "\n";
    exit(1);
}
?>

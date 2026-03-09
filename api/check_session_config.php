<?php
/**
 * Script de diagnóstico para verificar la configuración de sesiones PHP
 * Ejecuta este archivo desde el navegador para ver la configuración actual
 */

// Mostrar toda la información de configuración de sesión
echo "<h2>Configuración de Sesiones PHP</h2>";
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Configuración</th><th>Valor</th><th>Descripción</th></tr>";

// session.gc_maxlifetime
$gc_maxlifetime = ini_get('session.gc_maxlifetime');
echo "<tr>";
echo "<td><strong>session.gc_maxlifetime</strong></td>";
echo "<td>" . $gc_maxlifetime . " segundos (" . ($gc_maxlifetime / 3600) . " horas)</td>";
echo "<td>Tiempo después del cual los datos de sesión se consideran 'basura' y se eliminan</td>";
echo "</tr>";

// session.cookie_lifetime
$cookie_lifetime = ini_get('session.cookie_lifetime');
echo "<tr>";
echo "<td><strong>session.cookie_lifetime</strong></td>";
echo "<td>" . ($cookie_lifetime == 0 ? "0 (hasta que se cierre el navegador)" : "$cookie_lifetime segundos (" . ($cookie_lifetime / 3600) . " horas)") . "</td>";
echo "<td>Tiempo de vida de la cookie de sesión</td>";
echo "</tr>";

// session.gc_probability y session.gc_divisor
$gc_probability = ini_get('session.gc_probability');
$gc_divisor = ini_get('session.gc_divisor');
$gc_chance = ($gc_divisor > 0) ? (($gc_probability / $gc_divisor) * 100) : 0;
echo "<tr>";
echo "<td><strong>session.gc_probability / session.gc_divisor</strong></td>";
echo "<td>$gc_probability / $gc_divisor = " . number_format($gc_chance, 2) . "%</td>";
echo "<td>Probabilidad de que se ejecute el recolector de basura en cada petición</td>";
echo "</tr>";

// session.save_path
$save_path = ini_get('session.save_path');
echo "<tr>";
echo "<td><strong>session.save_path</strong></td>";
echo "<td>" . ($save_path ?: "(predeterminado del sistema)") . "</td>";
echo "<td>Directorio donde se guardan los archivos de sesión</td>";
echo "</tr>";

// session.name
$session_name = ini_get('session.name');
echo "<tr>";
echo "<td><strong>session.name</strong></td>";
echo "<td>$session_name</td>";
echo "<td>Nombre de la cookie de sesión</td>";
echo "</tr>";

echo "</table>";

// Información de configuración desde config.php
echo "<br><h2>Configuración Esperada (desde config.php)</h2>";
echo "<table border='1' cellpadding='5'>";
echo "<tr><td>session.gc_maxlifetime esperado</td><td>604800 segundos (7 días)</td></tr>";
echo "<tr><td>session.cookie_lifetime esperado</td><td>604800 segundos (7 días)</td></tr>";
echo "</table>";

// Advertencias
echo "<br><h2>Notas Importantes</h2>";
echo "<ul>";
echo "<li><strong style='color: red;'>IMPORTANTE:</strong> El valor de session.gc_maxlifetime puede estar limitado por la configuración del servidor (php.ini o .htaccess).</li>";
echo "<li>Si los valores mostrados no coinciden con los esperados, necesitas modificar el php.ini del servidor o crear un .htaccess.</li>";
echo "<li>En BlueHost, algunos valores pueden estar restringidos y requerir configuración adicional.</li>";
echo "<li><strong>session.gc_probability</strong>: Si es muy baja (ej: 1%), el recolector de basura se ejecutará muy pocas veces, lo cual es bueno para el rendimiento pero puede dejar archivos de sesión antiguos.</li>";
echo "</ul>";

// Información adicional de PHP
echo "<br><h2>Versión de PHP</h2>";
echo "<p>Versión: <strong>" . phpversion() . "</strong></p>";

// Opciones para solucionar problemas
echo "<br><h2>Soluciones Recomendadas</h2>";
echo "<ol>";
echo "<li><strong>Crear archivo .htaccess</strong> en la raíz del proyecto con:<br>";
echo "<pre>php_value session.gc_maxlifetime 604800\nphp_value session.cookie_lifetime 604800</pre>";
echo "</li>";
echo "<li><strong>Contactar al hosting</strong> para verificar si hay límites en la configuración de sesiones.</li>";
echo "<li><strong>Usar sesiones en base de datos</strong> en lugar de archivos (más complejo pero más confiable).</li>";
echo "</ol>";

// Información de la sesión actual (si existe)
session_start();
echo "<br><h2>Información de Sesión Actual</h2>";
if (isset($_SESSION['user_id'])) {
    echo "<p>Sesión activa para usuario ID: <strong>" . $_SESSION['user_id'] . "</strong></p>";
    if (isset($_SESSION['last_regeneration'])) {
        $last_regen = $_SESSION['last_regeneration'];
        $time_since_regen = time() - $last_regen;
        echo "<p>Última regeneración de ID: " . date('Y-m-d H:i:s', $last_regen) . " (hace " . round($time_since_regen / 3600, 2) . " horas)</p>";
    }
    if (isset($_SESSION['last_activity'])) {
        $last_activity = $_SESSION['last_activity'];
        $time_since_activity = time() - $last_activity;
        echo "<p>Última actividad: " . date('Y-m-d H:i:s', $last_activity) . " (hace " . round($time_since_activity / 60, 2) . " minutos)</p>";
    }
} else {
    echo "<p>No hay sesión activa.</p>";
}
?>

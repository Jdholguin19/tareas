<?php
date_default_timezone_set('America/Guayaquil');

echo "Hora PHP: " . date('Y-m-d H:i:s') . "\n";
echo "Timezone PHP: " . date_default_timezone_get() . "\n";

$pdo = new PDO("mysql:host=box5500.bluehost.com;dbname=portalao_ReunionesCS", 
               "portalao_jholguin", "jofCTV321!*");
$pdo->exec("SET time_zone = '-05:00'");

$result = $pdo->query("SELECT NOW() as mysql_time, @@session.time_zone as tz")->fetch();
echo "Hora MySQL: " . $result['mysql_time'] . "\n";
echo "Timezone MySQL: " . $result['tz'] . "\n";
?>
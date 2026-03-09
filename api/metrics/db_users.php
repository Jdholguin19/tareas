<?php
/**
 * Conexión PDO para la base de Planics (usuarios/proyectos/tareas)
 * Usa credenciales proporcionadas por el usuario.
 */
class DBUsers {
    private const DB_HOST = 'localhost';
    private const DB_PORT = 3306;
    private const DB_NAME = 'portalao_ReunionesCS';
    private const DB_USER = 'portalao_jholguin';
    private const DB_PASS = 'jofCTV321!*';
    private const DB_CHARSET = 'utf8mb4';

    private static ?PDO $pdo = null;

    public static function getDB(): PDO {
        if (self::$pdo === null) {
            $host = getenv('PLANICS_DB_HOST') ?: self::DB_HOST;
            $port = getenv('PLANICS_DB_PORT') ?: self::DB_PORT;
            $name = getenv('PLANICS_DB_NAME') ?: self::DB_NAME;
            $user = getenv('PLANICS_DB_USER') ?: self::DB_USER;
            $pass = getenv('PLANICS_DB_PASS') ?: self::DB_PASS;

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=".self::DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_PERSISTENT => false,
            ];
            self::$pdo = new PDO($dsn, $user, $pass, $options);
        }
        return self::$pdo;
    }

    private function __construct() {}
    private function __clone() {}
}

<?php
/**
 * Conexión a MySQL (PDO) para backend PHP ligero.
 * Usa variables de entorno o reemplazar con config en hosting.
 */
class DB {
    private const DB_HOST = 'localhost'; #box5500.bluehost.com
    private const DB_NAME = 'portalao_MetriCS';
    private const DB_USER = 'portalao_jholguin';
    private const DB_PASS = 'jofCTV321!*';
    private const DB_CHARSET = 'utf8mb4';

    private static ?PDO $pdo = null;

    public static function getDB(): PDO {
        if (self::$pdo === null) {
            $host = getenv('DB_HOST') ?: self::DB_HOST;
            $name = getenv('DB_NAME') ?: self::DB_NAME;
            $user = getenv('DB_USER') ?: self::DB_USER;
            $pass = getenv('DB_PASS') ?: self::DB_PASS;

            $dsn = "mysql:host={$host};dbname={$name};charset=".self::DB_CHARSET;
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

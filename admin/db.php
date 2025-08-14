<?php
$host = "localhost";
$dbname = "zapom263_quotes";
$username = "zapom263_darlingx";     // например zapom263_admin
$password = "qwerty2412";    // тот, что ты создавал в cPanel

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Ошибка подключения к БД: " . $conn->connect_error);
}
?>

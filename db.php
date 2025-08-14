<?php
// Database connection configuration
$host = "localhost";
$dbname = "zapom263_quotes";
$username = "УКАЖИ_ИМЯ_ПОЛЬЗОВАТЕЛЯ"; // Replace with your actual database username
$password = "УКАЖИ_ПАРОЛЬ"; // Replace with your actual database password

// Create database connection
$conn = new mysqli($host, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set character set to UTF-8
$conn->set_charset("utf8mb4");
?>
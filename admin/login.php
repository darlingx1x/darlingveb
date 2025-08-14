<?php
// 🐞 Debug mode
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 🔒 Сессия
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 📦 Подключение к базе данных
$host = "localhost";
$dbname = "zapom263_quotes";
$username = "zapom263_darlingx";
$password = "qwerty2412";

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Ошибка подключения к базе данных']);
    exit;
}

// 📩 Получение данных
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Все поля обязательны']);
    exit;
}

// 🔎 Поиск пользователя
$stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 1) {
    $stmt->bind_result($id, $hash);
    $stmt->fetch();

    if (password_verify($password, $hash)) {
        $_SESSION['user_id'] = $id;
        echo json_encode(['status' => 'success']);
        exit;
    }
}

// ❌ Неверные данные
http_response_code(401);
echo json_encode(['status' => 'error', 'message' => 'Неверный email или пароль']);
exit;

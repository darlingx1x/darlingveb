<?php
// Указываем, что ответ будет в формате JSON
header('Content-Type: application/json');

// Отладка ошибок
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Запускаем сессию
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Подключение к базе данных
$host = "localhost";
$dbname = "zapom263_quotes";
$username = "zapom263_darlingx"; // из cPanel
$password = "qwerty2412";

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Ошибка подключения к БД']);
    exit;
}

// Получаем данные из POST
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

// Проверка на пустоту
if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Все поля обязательны']);
    exit;
}

// Проверка силы пароля
if (strlen($password) < 6 || !preg_match('/[a-z]/i', $password) || !preg_match('/\d/', $password)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Пароль должен содержать минимум 6 символов, включая буквы и цифры']);
    exit;
}

// Проверка на повторную регистрацию
$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['status' => 'error', 'message' => 'Email уже зарегистрирован']);
    exit;
}

// Хешируем пароль
$hash = password_hash($password, PASSWORD_DEFAULT);

// Сохраняем пользователя
$stmt = $conn->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
$stmt->bind_param("ss", $email, $hash);

if ($stmt->execute()) {
    $_SESSION['user_id'] = $stmt->insert_id;
    echo json_encode([
        'status' => 'success',
        'message' => 'Регистрация успешна',
        'redirect' => '/quotes.html'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Ошибка сервера при регистрации']);
}
?>

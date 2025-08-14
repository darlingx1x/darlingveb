<?php
session_start();
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Авторизуйтесь']);
    exit;
}

$text = $_POST['text'] ?? '';
$author = $_POST['author'] ?? 'Аноним';
$user_id = $_SESSION['user_id'];

$stmt = $conn->prepare("INSERT INTO quotes (text, author, user_id) VALUES (?, ?, ?)");
$stmt->bind_param("ssi", $text, $author, $user_id);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Ошибка при сохранении']);
}

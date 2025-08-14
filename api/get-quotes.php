<?php
$host = "localhost";
$dbname = "zapom263_quotes";
$username = "УКАЖИ_ИМЯ_ПОЛЬЗОВАТЕЛЯ";
$password = "УКАЖИ_ПАРОЛЬ";

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "DB error: " . $conn->connect_error]);
    exit;
}

$sql = "SELECT text, author, created_at FROM quotes ORDER BY created_at DESC";
$result = $conn->query($sql);

$quotes = [];
while ($row = $result->fetch_assoc()) {
    $quotes[] = $row;
}

header('Content-Type: application/json');
echo json_encode(["status" => "success", "quotes" => $quotes], JSON_UNESCAPED_UNICODE);

$conn->close();
?>

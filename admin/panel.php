<?php
require_once 'auth.php';
$host = "localhost";
$dbname = "zapom263_quotes";
$username = "ВАШ_ЛОГИН";
$password = "ВАШ_ПАРОЛЬ";

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Ошибка подключения: " . $conn->connect_error);
}

if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM quotes WHERE id = $id");
    header('Location: panel.php');
    exit;
}

$result = $conn->query("SELECT * FROM quotes ORDER BY created_at DESC");
?>

<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Админка - Цитаты</title>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    body { font-family: VT323, monospace; background: #000; color: #FFD700; padding: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
    th, td { padding: 12px; border-bottom: 1px solid #555; }
    .delete-btn { color: #f55; text-decoration: none; }
    .delete-btn:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🧠 Панель администратора</h1>
  <p><a href="logout.php">🔓 Выйти</a></p>
  <table>
    <tr><th>ID</th><th>Текст</th><th>Автор</th><th>Дата</th><th>Удалить</th></tr>
    <?php while ($row = $result->fetch_assoc()): ?>
      <tr>
        <td><?= $row['id'] ?></td>
        <td><?= htmlspecialchars($row['text']) ?></td>
        <td><?= htmlspecialchars($row['author']) ?></td>
        <td><?= $row['created_at'] ?></td>
        <td><a class="delete-btn" href="?delete=<?= $row['id'] ?>" data-confirm="Удалить цитату?">удалить</a></td>
      </tr>
    <?php endwhile; ?>
  </table>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.delete-btn').forEach(function(link) {
        link.addEventListener('click', function(e) {
          const message = this.getAttribute('data-confirm');
          if (!confirm(message)) {
            e.preventDefault();
          }
        });
      });
    });
  </script>
</body>
</html>

<?php
session_start();

// 🔐 Настройки доступа
$adminPassword = 'darlingx2025'; // ❗️Измени на свой надёжный пароль

// 🚪 Выход
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: log.php");
    exit;
}

// 🔑 Обработка входа
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if ($_POST['password'] === $adminPassword) {
        $_SESSION['offline_admin'] = true;
    } else {
        $error = '❌ Неверный пароль.';
    }
}

// 🔒 Если не авторизован — показываем форму входа
if (!isset($_SESSION['offline_admin'])):
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Вход в лог | DarlingX</title>
  <style>
    body {
      background: #0a0a0a;
      color: #00ffcc;
      font-family: 'VT323', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    h1 {
      color: #0ff;
    }
    input, button {
      font-family: inherit;
      font-size: 1.2rem;
      margin: 10px;
      padding: 10px;
      background: #111;
      border: 1px solid #0f0;
      color: #0f0;
    }
    button:hover {
      background: #0f0;
      color: #000;
    }
  </style>
</head>
<body>
  <h1>🔐 Вход в Offline Log</h1>
  <form method="POST">
    <input type="password" name="password" placeholder="Введите пароль" required>
    <br>
    <button type="submit">Войти</button>
    <?php if (isset($error)): ?>
      <p style="color:#f55;"><?= $error ?></p>
    <?php endif; ?>
  </form>
</body>
</html>
<?php exit; endif; ?>

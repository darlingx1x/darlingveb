<?php
session_start();
$admin_password = 'darlingx2025'; // 🔑 Поменяй на свой надёжный пароль

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($_POST['password'] === $admin_password) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: panel.php');
        exit;
    } else {
        die('❌ Неверный пароль.');
    }
}

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: log.html');
    exit;
}
?>

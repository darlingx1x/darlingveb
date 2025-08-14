<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'logged_in' => true,
        'email' => $_SESSION['user_email'] ?? 'User'
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}

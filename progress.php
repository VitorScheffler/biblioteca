<?php
header("Content-Type: application/json");

$file = __DIR__ . "/progress/progress.json";

if (!file_exists($file)) {
    file_put_contents($file, "{}");
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    echo file_get_contents($file);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = file_get_contents("php://input");
    file_put_contents($file, $data, LOCK_EX);
    echo json_encode(["status" => "ok"]);
    exit;
}

http_response_code(405);
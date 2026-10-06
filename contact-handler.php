<?php
// FIT ATLASIA: minimal production-ready contact endpoint for Hostinger/shared PHP hosting.
// IMPORTANT: set the destination email before launch.
$DESTINATION_EMAIL = 'CHANGE-ME@example.com';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'message'=>'Method not allowed.']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

function clean_text($value, $max=4000) {
  $value = trim((string)$value);
  $value = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $value);
  return mb_substr($value, 0, $max);
}

$name = clean_text($data['name'] ?? '', 120);
$email = trim((string)($data['email'] ?? ''));
$company = clean_text($data['company'] ?? '', 160);
$project = clean_text($data['project'] ?? '', 80);
$location = clean_text($data['location'] ?? '', 180);
$brief = clean_text($data['brief'] ?? '', 5000);
$page = clean_text($data['page'] ?? '', 500);

if ($DESTINATION_EMAIL === 'CHANGE-ME@example.com') {
  http_response_code(503);
  echo json_encode(['ok'=>false,'message'=>'Destination email belum dikonfigurasi di contact-handler.php.']);
  exit;
}

if (!$name || !$brief || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok'=>false,'message'=>'Nama, email valid, dan project brief wajib diisi.']);
  exit;
}

$subject = 'FIT ATLASIA: New project brief';
$body = "New project brief\n\n" .
  "Nama: {$name}\n" .
  "Email: {$email}\n" .
  "Company: {$company}\n" .
  "Facility: {$project}\n" .
  "Location: {$location}\n\n" .
  "Brief:\n{$brief}\n\n" .
  "Page: {$page}\n";

$headers = [
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'From: FIT ATLASIA Website <no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '>',
  'Reply-To: ' . $email,
];

$sent = mail($DESTINATION_EMAIL, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'message'=>'Server gagal mengirim email. Cek konfigurasi email hosting / SMTP.']);
  exit;
}

echo json_encode(['ok'=>true]);

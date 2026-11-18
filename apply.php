<?php
/* TroveMart — receives a job application from careers.html and emails it to
   the hiring inbox with the CV attached.

   Nothing is written to disk. A CV is personal data, and storing it here would
   mean securing it, backing it up and deleting it on a schedule; emailing it
   straight on keeps this page out of that entirely. The consequence is that if
   the email cannot be sent we must refuse the application rather than accept
   one we would silently lose — the page then offers a mailto fallback. */

header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';

function fail($msg, $code = 400)
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed.', 405);

// bots fill every field they can see, including the hidden one
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);   // look successful; send nothing
    exit;
}

$name  = trim($_POST['name']            ?? '');
$email = trim($_POST['email']           ?? '');
$phone = trim($_POST['phone']           ?? '');
$rtw   = trim($_POST['right_to_work']   ?? '');
$msg   = trim($_POST['message']         ?? '');
$role  = trim($_POST['role']            ?? 'Unspecified role');

if ($name === '' || $email === '' || $msg === '') fail('Please fill in the required fields.');
if (!filter_var($email, FILTER_VALIDATE_EMAIL))   fail('That email address does not look right.');
if (mb_strlen($name) > 120 || mb_strlen($msg) > 5000) fail('That is longer than we can accept.');

// header injection guard: these go into a Reply-To and a Subject
if (preg_match('/[\r\n]/', $name . $email . $role)) fail('Invalid characters in your details.');

/* ---- CV attachment -------------------------------------------------- */
$cvPath = $cvName = null;
if (isset($_FILES['cv']) && $_FILES['cv']['error'] !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['cv'];
    if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) {
        fail('That CV is too large — the limit is 2 MB.');
    }
    if ($f['error'] !== UPLOAD_ERR_OK)   fail('Your CV did not upload correctly. Please try again.');
    if ($f['size'] > 2 * 1024 * 1024)    fail('That CV is too large — the limit is 2 MB.');
    if (!is_uploaded_file($f['tmp_name'])) fail('Your CV did not upload correctly.');

    $allowedExt = ['pdf', 'doc', 'docx', 'odt', 'txt', 'rtf'];
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExt, true)) {
        fail('Please attach your CV as a PDF or Word document.');
    }
    $allowedMime = [
        'application/pdf', 'application/msword', 'application/rtf', 'text/rtf', 'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text', 'application/octet-stream',
    ];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($f['tmp_name']);
    if (!in_array($mime, $allowedMime, true)) {
        fail('Please attach your CV as a PDF or Word document.');
    }

    $cvPath = $f['tmp_name'];
    // never trust the browser's filename on the way back out
    $safe   = preg_replace('/[^A-Za-z0-9 ._-]/', '', $name) ?: 'applicant';
    $cvName = 'CV - ' . trim($safe) . '.' . $ext;
}

/* ---- compose ---------------------------------------------------------- */
$lines = [
    'New job application',
    '',
    'Role:            ' . $role,
    'Name:            ' . $name,
    'Email:           ' . $email,
    'Phone:           ' . ($phone !== '' ? $phone : '(not given)'),
    'Right to work:   ' . ($rtw !== '' ? $rtw : '(not answered)'),
    'CV attached:     ' . ($cvName ? 'yes' : 'no'),
    'Received:        ' . date('Y-m-d H:i'),
    '',
    'Why they want the job:',
    $msg,
];
$body    = implode("\n", $lines);
$subject = 'Application: ' . $role . ' — ' . $name;

/* ---- send ------------------------------------------------------------- */
$smtpReady = defined('SMTP_HOST') && SMTP_HOST !== '' && stripos(SMTP_HOST, 'REPLACE') === false;
if (!$smtpReady) {
    error_log('TroveMart: job application could not be sent — SMTP not configured');
    fail('Our application form is not accepting submissions at the moment.', 503);
}

require_once __DIR__ . '/vendor/phpmailer/Exception.php';
require_once __DIR__ . '/vendor/phpmailer/PHPMailer.php';
require_once __DIR__ . '/vendor/phpmailer/SMTP.php';

try {
    $m = new \PHPMailer\PHPMailer\PHPMailer(true);
    $m->isSMTP();
    $m->Host       = SMTP_HOST;
    $m->Port       = defined('SMTP_PORT') ? (int) SMTP_PORT : 587;
    $m->SMTPAuth   = true;
    $m->Username   = SMTP_USER;
    $m->Password   = SMTP_PASS;
    $m->SMTPSecure = ($m->Port === 465) ? 'ssl' : 'tls';
    $m->CharSet    = 'UTF-8';
    $m->Timeout    = 25;

    $m->setFrom(SMTP_USER, 'TroveMart Careers');
    $m->addAddress(ORDER_EMAIL);
    $m->addReplyTo($email, $name);
    $m->Subject = $subject;
    $m->Body    = $body;
    if ($cvPath) $m->addAttachment($cvPath, $cvName);
    $m->send();
} catch (\Throwable $e) {
    error_log('TroveMart: job application email failed — ' . $e->getMessage());
    fail('We could not send your application just now.', 502);
}

echo json_encode(['ok' => true]);

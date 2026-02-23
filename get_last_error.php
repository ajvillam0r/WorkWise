<?php
$logFile = __DIR__ . '/storage/logs/laravel.log';
if (!file_exists($logFile)) {
    file_put_contents(__DIR__ . '/error_out.txt', 'Log file not found.');
    exit;
}

$contents = file_get_contents($logFile);
$entries = preg_split('/(?=\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\])/', $contents);

$errors = [];
foreach ($entries as $entry) {
    if (strpos($entry, 'local.ERROR') !== false) {
        $lines = explode("\n", trim($entry));
        $errors[] = $lines[0];
    }
}

$lastErrors = array_slice($errors, -10);
file_put_contents(__DIR__ . '/error_out.txt', implode("\n", $lastErrors));

<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // 生产环境建议改为具体域名
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ==================== 配置区 ====================
// 方式1：直接配置（开发环境）
$api_key = 'YOUR_API_KEY_HERE'; // 🔴 替换为你的火山引擎 API Key

// 方式2：从环境变量读取（推荐，更安全）
// $api_key = getenv('VOLC_API_KEY') ?: 'YOUR_API_KEY_HERE';

// 火山引擎 API 地址
$api_url = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
// =================================================

// 获取 POST 数据
$input = json_decode(file_get_contents('php://input'), true);

// 验证数据
if (!$input || !isset($input['model']) || !isset($input['messages'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid request data',
        'message' => 'Missing required fields: model, messages'
    ]);
    exit;
}

// 验证 API Key
if (empty($api_key) || $api_key === 'YOUR_API_KEY_HERE') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'API Key not configured',
        'message' => 'Please configure your VolcEngine API Key in api_proxy.php'
    ]);
    exit;
}

// 准备请求数据（移除前端可能发送的敏感信息）
unset($input['api_key']); // 确保不泄露
$postData = json_encode($input);

// 初始化 cURL
$ch = curl_init($api_url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postData,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $api_key,
        'Accept: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2
]);

// 执行请求
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// 错误处理
if ($error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'cURL Error',
        'message' => $error
    ]);
    exit;
}

// 返回结果
http_response_code($httpCode);
if ($httpCode === 200) {
    echo $response;
} else {
    // 尝试解析错误信息
    $errorData = json_decode($response, true);
    echo json_encode([
        'success' => false,
        'error' => 'API Error',
        'http_code' => $httpCode,
        'message' => $errorData['error']['message'] ?? $response
    ]);
}
?>

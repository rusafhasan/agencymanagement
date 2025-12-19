<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setHeaders();

$action = $_GET['action'] ?? '';
$method = getMethod();

switch ($action) {
    case 'login':
        if ($method !== 'POST') {
            errorResponse('Method not allowed', 405);
        }
        handleLogin();
        break;
        
    case 'signup':
        if ($method !== 'POST') {
            errorResponse('Method not allowed', 405);
        }
        handleSignup();
        break;
        
    case 'me':
        if ($method !== 'GET') {
            errorResponse('Method not allowed', 405);
        }
        handleMe();
        break;
        
    case 'change-password':
        if ($method !== 'POST') {
            errorResponse('Method not allowed', 405);
        }
        handleChangePassword();
        break;
        
    case 'update-profile':
        if ($method !== 'PUT') {
            errorResponse('Method not allowed', 405);
        }
        handleUpdateProfile();
        break;
        
    default:
        errorResponse('Invalid action', 400);
}

function handleLogin() {
    $input = getJsonInput();
    
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    
    if (!$email || !$password) {
        errorResponse('Email and password are required');
    }
    
    if (!isValidEmail($email)) {
        errorResponse('Invalid email format');
    }
    
    $user = db()->fetchOne(
        "SELECT id, email, name, password_hash, role, disabled, phone, address, company_name, profile_picture 
         FROM users WHERE email = ?",
        [$email]
    );
    
    if (!$user) {
        errorResponse('No account found with this email');
    }
    
    if (!verifyPassword($password, $user['password_hash'])) {
        errorResponse('Incorrect password');
    }
    
    if ($user['disabled']) {
        errorResponse('Your account has been disabled. Please contact an administrator.');
    }
    
    $token = createJWT([
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
    ]);
    
    jsonResponse([
        'token' => $token,
        'user' => formatUser($user),
    ]);
}

function handleSignup() {
    $input = getJsonInput();
    
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    $name = sanitizeString($input['name'] ?? '');
    
    if (!$email || !$password || !$name) {
        errorResponse('Email, password, and name are required');
    }
    
    if (!isValidEmail($email)) {
        errorResponse('Invalid email format');
    }
    
    if (strlen($password) < 6) {
        errorResponse('Password must be at least 6 characters');
    }
    
    if (strlen($name) < 2 || strlen($name) > 100) {
        errorResponse('Name must be between 2 and 100 characters');
    }
    
    // Check if user exists
    $existing = db()->fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
    if ($existing) {
        errorResponse('An account with this email already exists');
    }
    
    // Check if this is the first user (becomes admin)
    $userCount = db()->fetchOne("SELECT COUNT(*) as count FROM users");
    $isFirstUser = ($userCount['count'] ?? 0) == 0;
    
    $userId = generateUUID();
    $passwordHash = hashPassword($password);
    $role = $isFirstUser ? 'admin' : 'client';
    
    db()->insert('users', [
        'id' => $userId,
        'email' => $email,
        'name' => $name,
        'password_hash' => $passwordHash,
        'role' => $role,
        'disabled' => 0,
        'created_at' => date('Y-m-d H:i:s'),
    ]);
    
    $token = createJWT([
        'id' => $userId,
        'email' => $email,
        'role' => $role,
    ]);
    
    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'name' => $name,
            'role' => $role,
            'disabled' => false,
            'profile' => null,
        ],
    ], 201);
}

function handleMe() {
    $authUser = requireAuth();
    
    $user = db()->fetchOne(
        "SELECT id, email, name, role, disabled, phone, address, company_name, profile_picture 
         FROM users WHERE id = ?",
        [$authUser['id']]
    );
    
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    jsonResponse(['user' => formatUser($user)]);
}

function handleChangePassword() {
    $authUser = requireAuth();
    $input = getJsonInput();
    
    $oldPassword = $input['oldPassword'] ?? '';
    $newPassword = $input['newPassword'] ?? '';
    
    if (!$oldPassword || !$newPassword) {
        errorResponse('Old password and new password are required');
    }
    
    if (strlen($newPassword) < 6) {
        errorResponse('New password must be at least 6 characters');
    }
    
    $user = db()->fetchOne("SELECT password_hash FROM users WHERE id = ?", [$authUser['id']]);
    
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    if (!verifyPassword($oldPassword, $user['password_hash'])) {
        errorResponse('Current password is incorrect');
    }
    
    $newHash = hashPassword($newPassword);
    db()->update('users', ['password_hash' => $newHash], 'id = ?', [$authUser['id']]);
    
    jsonResponse(['message' => 'Password changed successfully']);
}

function handleUpdateProfile() {
    $authUser = requireAuth();
    $input = getJsonInput();
    
    $updates = [];
    
    if (isset($input['name'])) {
        $name = sanitizeString($input['name']);
        if (strlen($name) < 2 || strlen($name) > 100) {
            errorResponse('Name must be between 2 and 100 characters');
        }
        $updates['name'] = $name;
    }
    
    if (isset($input['phone'])) {
        $updates['phone'] = sanitizeString($input['phone']);
    }
    
    if (isset($input['address'])) {
        $updates['address'] = sanitizeString($input['address']);
    }
    
    if (isset($input['companyName'])) {
        $updates['company_name'] = sanitizeString($input['companyName']);
    }
    
    if (isset($input['profilePicture'])) {
        $updates['profile_picture'] = $input['profilePicture'];
    }
    
    if (empty($updates)) {
        errorResponse('No updates provided');
    }
    
    db()->update('users', $updates, 'id = ?', [$authUser['id']]);
    
    $user = db()->fetchOne(
        "SELECT id, email, name, role, disabled, phone, address, company_name, profile_picture 
         FROM users WHERE id = ?",
        [$authUser['id']]
    );
    
    jsonResponse(['user' => formatUser($user)]);
}

function formatUser(array $user): array {
    return [
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'role' => $user['role'],
        'disabled' => (bool) $user['disabled'],
        'profile' => [
            'phone' => $user['phone'] ?? null,
            'address' => $user['address'] ?? null,
            'companyName' => $user['company_name'] ?? null,
            'profilePicture' => $user['profile_picture'] ?? null,
        ],
    ];
}

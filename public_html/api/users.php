<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setHeaders();

$method = getMethod();
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getUser($id);
        } else {
            getAllUsers();
        }
        break;
        
    case 'PUT':
        if (!$id) {
            errorResponse('User ID required');
        }
        updateUser($id);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllUsers() {
    requireAdmin();
    
    $users = db()->fetchAll(
        "SELECT id, email, name, role, disabled, phone, address, company_name, profile_picture, created_at 
         FROM users ORDER BY created_at DESC"
    );
    
    $formatted = array_map(function($user) {
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
    }, $users);
    
    jsonResponse(['users' => $formatted]);
}

function getUser(string $id) {
    $authUser = requireAuth();
    
    // Users can only view their own profile unless they're admin
    if ($authUser['role'] !== 'admin' && $authUser['id'] !== $id) {
        errorResponse('Access denied', 403);
    }
    
    $user = db()->fetchOne(
        "SELECT id, email, name, role, disabled, phone, address, company_name, profile_picture 
         FROM users WHERE id = ?",
        [$id]
    );
    
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    jsonResponse([
        'user' => [
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
        ],
    ]);
}

function updateUser(string $id) {
    $authUser = requireAdmin();
    $input = getJsonInput();
    
    // Prevent admin from disabling themselves
    if ($id === $authUser['id'] && isset($input['disabled']) && $input['disabled']) {
        errorResponse('Cannot disable your own account');
    }
    
    $user = db()->fetchOne("SELECT id FROM users WHERE id = ?", [$id]);
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    $updates = [];
    
    if (isset($input['role'])) {
        $validRoles = ['admin', 'employee', 'client'];
        if (!in_array($input['role'], $validRoles)) {
            errorResponse('Invalid role');
        }
        $updates['role'] = $input['role'];
    }
    
    if (isset($input['disabled'])) {
        $updates['disabled'] = $input['disabled'] ? 1 : 0;
    }
    
    if (empty($updates)) {
        errorResponse('No updates provided');
    }
    
    db()->update('users', $updates, 'id = ?', [$id]);
    
    jsonResponse(['message' => 'User updated successfully']);
}

<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setHeaders();

$method = getMethod();
$taskId = $_GET['task_id'] ?? null;

switch ($method) {
    case 'GET':
        if (!$taskId) {
            errorResponse('Task ID is required');
        }
        getComments($taskId);
        break;
        
    case 'POST':
        createComment();
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getComments(string $taskId) {
    $authUser = requireAuth();
    
    // Check task exists and user has access
    $task = db()->fetchOne("SELECT * FROM tasks WHERE id = ?", [$taskId]);
    if (!$task) {
        errorResponse('Task not found', 404);
    }
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$task['project_id']]);
    if (!canAccessProject($authUser, $project)) {
        errorResponse('Access denied', 403);
    }
    
    $comments = db()->fetchAll(
        "SELECT c.*, u.name as author_name FROM comments c
         LEFT JOIN users u ON u.id = c.author_id
         WHERE c.task_id = ?
         ORDER BY c.created_at ASC",
        [$taskId]
    );
    
    jsonResponse(['comments' => array_map('formatComment', $comments)]);
}

function createComment() {
    $authUser = requireAuth();
    $input = getJsonInput();
    
    $taskId = $input['taskId'] ?? null;
    $content = sanitizeString($input['content'] ?? '');
    
    if (!$taskId || !$content) {
        errorResponse('Task ID and content are required');
    }
    
    // Check task exists and user has access
    $task = db()->fetchOne("SELECT * FROM tasks WHERE id = ?", [$taskId]);
    if (!$task) {
        errorResponse('Task not found', 404);
    }
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$task['project_id']]);
    if (!canAccessProject($authUser, $project)) {
        errorResponse('Access denied', 403);
    }
    
    // Get author name
    $author = db()->fetchOne("SELECT name FROM users WHERE id = ?", [$authUser['id']]);
    
    $commentId = generateUUID();
    
    db()->insert('comments', [
        'id' => $commentId,
        'task_id' => $taskId,
        'author_id' => $authUser['id'],
        'content' => $content,
        'created_at' => date('Y-m-d H:i:s'),
    ]);
    
    $comment = db()->fetchOne(
        "SELECT c.*, u.name as author_name FROM comments c
         LEFT JOIN users u ON u.id = c.author_id
         WHERE c.id = ?",
        [$commentId]
    );
    
    jsonResponse(['comment' => formatComment($comment)], 201);
}

function canAccessProject(array $authUser, array $project): bool {
    if ($authUser['role'] === 'admin') {
        return true;
    }
    
    $workspace = db()->fetchOne("SELECT * FROM workspaces WHERE id = ?", [$project['workspace_id']]);
    
    if ($authUser['role'] === 'client') {
        return $workspace && $workspace['client_id'] === $authUser['id'];
    }
    
    if ($authUser['role'] === 'employee') {
        $assignment = db()->fetchOne(
            "SELECT 1 FROM project_employees WHERE project_id = ? AND employee_id = ?",
            [$project['id'], $authUser['id']]
        );
        return $assignment !== null;
    }
    
    return false;
}

function formatComment(array $comment): array {
    return [
        'id' => $comment['id'],
        'taskId' => $comment['task_id'],
        'authorId' => $comment['author_id'],
        'authorName' => $comment['author_name'] ?? 'Unknown',
        'content' => $comment['content'],
        'createdAt' => $comment['created_at'],
    ];
}

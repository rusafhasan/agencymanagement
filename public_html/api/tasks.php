<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setHeaders();

$method = getMethod();
$id = $_GET['id'] ?? null;
$projectId = $_GET['project_id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getTask($id);
        } else {
            getAllTasks($projectId);
        }
        break;
        
    case 'POST':
        createTask();
        break;
        
    case 'PUT':
        if (!$id) {
            errorResponse('Task ID required');
        }
        updateTask($id);
        break;
        
    case 'DELETE':
        if (!$id) {
            errorResponse('Task ID required');
        }
        deleteTask($id);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllTasks(?string $projectId) {
    $authUser = requireAuth();
    
    if (!$projectId) {
        errorResponse('Project ID is required');
    }
    
    // Check project access
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        errorResponse('Project not found', 404);
    }
    
    if (!canAccessProject($authUser, $project)) {
        errorResponse('Access denied', 403);
    }
    
    $tasks = db()->fetchAll(
        "SELECT * FROM tasks WHERE project_id = ? ORDER BY order_num ASC, created_at DESC",
        [$projectId]
    );
    
    jsonResponse(['tasks' => array_map('formatTask', $tasks)]);
}

function getTask(string $id) {
    $authUser = requireAuth();
    
    $task = db()->fetchOne("SELECT * FROM tasks WHERE id = ?", [$id]);
    
    if (!$task) {
        errorResponse('Task not found', 404);
    }
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$task['project_id']]);
    
    if (!canAccessProject($authUser, $project)) {
        errorResponse('Access denied', 403);
    }
    
    jsonResponse(['task' => formatTask($task)]);
}

function createTask() {
    $authUser = requireAuth();
    $input = getJsonInput();
    
    $projectId = $input['projectId'] ?? null;
    $title = sanitizeString($input['title'] ?? '');
    $description = sanitizeString($input['description'] ?? '');
    
    if (!$projectId || !$title) {
        errorResponse('Project ID and title are required');
    }
    
    // Check project access
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        errorResponse('Project not found', 404);
    }
    
    if (!canAccessProject($authUser, $project)) {
        errorResponse('Access denied', 403);
    }
    
    // Get max order
    $maxOrder = db()->fetchOne(
        "SELECT COALESCE(MAX(order_num), 0) as max_order FROM tasks WHERE project_id = ?",
        [$projectId]
    );
    
    $taskId = generateUUID();
    
    db()->insert('tasks', [
        'id' => $taskId,
        'project_id' => $projectId,
        'title' => $title,
        'description' => $description,
        'status' => 'not-started',
        'assigned_to' => null,
        'due_date' => null,
        'order_num' => ($maxOrder['max_order'] ?? 0) + 1,
        'created_at' => date('Y-m-d H:i:s'),
    ]);
    
    $task = db()->fetchOne("SELECT * FROM tasks WHERE id = ?", [$taskId]);
    
    jsonResponse(['task' => formatTask($task)], 201);
}

function updateTask(string $id) {
    $authUser = requireAuth();
    
    $task = db()->fetchOne("SELECT * FROM tasks WHERE id = ?", [$id]);
    if (!$task) {
        errorResponse('Task not found', 404);
    }
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$task['project_id']]);
    
    if (!canAccessProject($authUser, $project)) {
        errorResponse('Access denied', 403);
    }
    
    $input = getJsonInput();
    $updates = [];
    
    if (isset($input['title'])) {
        $updates['title'] = sanitizeString($input['title']);
    }
    
    if (isset($input['description'])) {
        $updates['description'] = sanitizeString($input['description']);
    }
    
    if (isset($input['status'])) {
        $validStatuses = ['not-started', 'in-progress', 'needs-review', 'completed'];
        if (!in_array($input['status'], $validStatuses)) {
            errorResponse('Invalid status');
        }
        $updates['status'] = $input['status'];
    }
    
    if (array_key_exists('assignedTo', $input)) {
        $updates['assigned_to'] = $input['assignedTo'];
    }
    
    if (array_key_exists('dueDate', $input)) {
        $updates['due_date'] = $input['dueDate'];
    }
    
    if (isset($input['order'])) {
        $updates['order_num'] = (int) $input['order'];
    }
    
    if (empty($updates)) {
        errorResponse('No updates provided');
    }
    
    db()->update('tasks', $updates, 'id = ?', [$id]);
    
    $task = db()->fetchOne("SELECT * FROM tasks WHERE id = ?", [$id]);
    
    jsonResponse(['task' => formatTask($task)]);
}

function deleteTask(string $id) {
    $authUser = requireAuth();
    
    $task = db()->fetchOne("SELECT * FROM tasks WHERE id = ?", [$id]);
    if (!$task) {
        errorResponse('Task not found', 404);
    }
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$task['project_id']]);
    
    // Only admin can delete tasks
    if ($authUser['role'] !== 'admin') {
        errorResponse('Access denied', 403);
    }
    
    // Delete comments first
    db()->delete('comments', 'task_id = ?', [$id]);
    db()->delete('tasks', 'id = ?', [$id]);
    
    jsonResponse(['message' => 'Task deleted successfully']);
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

function formatTask(array $task): array {
    return [
        'id' => $task['id'],
        'projectId' => $task['project_id'],
        'title' => $task['title'],
        'description' => $task['description'],
        'status' => $task['status'],
        'assignedTo' => $task['assigned_to'],
        'dueDate' => $task['due_date'],
        'order' => (int) $task['order_num'],
        'createdAt' => $task['created_at'],
    ];
}

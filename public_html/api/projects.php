<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setHeaders();

$method = getMethod();
$id = $_GET['id'] ?? null;
$workspaceId = $_GET['workspace_id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getProject($id);
        } else {
            getAllProjects($workspaceId);
        }
        break;
        
    case 'POST':
        createProject();
        break;
        
    case 'PUT':
        if (!$id) {
            errorResponse('Project ID required');
        }
        updateProject($id);
        break;
        
    case 'DELETE':
        if (!$id) {
            errorResponse('Project ID required');
        }
        deleteProject($id);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllProjects(?string $workspaceId) {
    $authUser = requireAuth();
    
    if ($workspaceId) {
        if ($authUser['role'] === 'admin') {
            $projects = db()->fetchAll(
                "SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at DESC",
                [$workspaceId]
            );
        } elseif ($authUser['role'] === 'client') {
            // Check if client owns the workspace
            $workspace = db()->fetchOne(
                "SELECT id FROM workspaces WHERE id = ? AND client_id = ?",
                [$workspaceId, $authUser['id']]
            );
            if (!$workspace) {
                errorResponse('Access denied', 403);
            }
            $projects = db()->fetchAll(
                "SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at DESC",
                [$workspaceId]
            );
        } else {
            // Employee - only assigned projects
            $projects = db()->fetchAll(
                "SELECT p.* FROM projects p
                 INNER JOIN project_employees pe ON pe.project_id = p.id
                 WHERE p.workspace_id = ? AND pe.employee_id = ?
                 ORDER BY p.created_at DESC",
                [$workspaceId, $authUser['id']]
            );
        }
    } else {
        if ($authUser['role'] === 'admin') {
            $projects = db()->fetchAll("SELECT * FROM projects ORDER BY created_at DESC");
        } elseif ($authUser['role'] === 'client') {
            $projects = db()->fetchAll(
                "SELECT p.* FROM projects p
                 INNER JOIN workspaces w ON w.id = p.workspace_id
                 WHERE w.client_id = ?
                 ORDER BY p.created_at DESC",
                [$authUser['id']]
            );
        } else {
            $projects = db()->fetchAll(
                "SELECT p.* FROM projects p
                 INNER JOIN project_employees pe ON pe.project_id = p.id
                 WHERE pe.employee_id = ?
                 ORDER BY p.created_at DESC",
                [$authUser['id']]
            );
        }
    }
    
    // Get assigned employee IDs for each project
    $formattedProjects = array_map(function($project) {
        $employees = db()->fetchAll(
            "SELECT employee_id FROM project_employees WHERE project_id = ?",
            [$project['id']]
        );
        return formatProject($project, array_column($employees, 'employee_id'));
    }, $projects);
    
    jsonResponse(['projects' => $formattedProjects]);
}

function getProject(string $id) {
    $authUser = requireAuth();
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$id]);
    
    if (!$project) {
        errorResponse('Project not found', 404);
    }
    
    // Check access
    if (!canAccessProject($authUser, $project)) {
        errorResponse('Access denied', 403);
    }
    
    $employees = db()->fetchAll(
        "SELECT employee_id FROM project_employees WHERE project_id = ?",
        [$id]
    );
    
    jsonResponse(['project' => formatProject($project, array_column($employees, 'employee_id'))]);
}

function createProject() {
    $authUser = requireAuth();
    
    // Only admin and client can create projects
    if ($authUser['role'] === 'employee') {
        errorResponse('Access denied', 403);
    }
    
    $input = getJsonInput();
    
    $workspaceId = $input['workspaceId'] ?? null;
    $name = sanitizeString($input['name'] ?? '');
    $description = sanitizeString($input['description'] ?? '');
    
    if (!$workspaceId || !$name) {
        errorResponse('Workspace ID and name are required');
    }
    
    // Check workspace access
    $workspace = db()->fetchOne("SELECT * FROM workspaces WHERE id = ?", [$workspaceId]);
    if (!$workspace) {
        errorResponse('Workspace not found', 404);
    }
    
    if ($authUser['role'] === 'client' && $workspace['client_id'] !== $authUser['id']) {
        errorResponse('Access denied', 403);
    }
    
    $projectId = generateUUID();
    
    db()->insert('projects', [
        'id' => $projectId,
        'workspace_id' => $workspaceId,
        'name' => $name,
        'description' => $description,
        'created_at' => date('Y-m-d H:i:s'),
    ]);
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$projectId]);
    
    jsonResponse(['project' => formatProject($project, [])], 201);
}

function updateProject(string $id) {
    $authUser = requireAuth();
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$id]);
    if (!$project) {
        errorResponse('Project not found', 404);
    }
    
    // Only admin can update projects
    if ($authUser['role'] !== 'admin') {
        // Clients can update their own projects
        $workspace = db()->fetchOne("SELECT * FROM workspaces WHERE id = ?", [$project['workspace_id']]);
        if ($authUser['role'] !== 'client' || $workspace['client_id'] !== $authUser['id']) {
            errorResponse('Access denied', 403);
        }
    }
    
    $input = getJsonInput();
    $updates = [];
    
    if (isset($input['name'])) {
        $updates['name'] = sanitizeString($input['name']);
    }
    
    if (isset($input['description'])) {
        $updates['description'] = sanitizeString($input['description']);
    }
    
    if (!empty($updates)) {
        db()->update('projects', $updates, 'id = ?', [$id]);
    }
    
    // Handle employee assignments (admin only)
    if (isset($input['assignedEmployeeIds']) && $authUser['role'] === 'admin') {
        $employeeIds = $input['assignedEmployeeIds'];
        
        // Remove existing assignments
        db()->delete('project_employees', 'project_id = ?', [$id]);
        
        // Add new assignments
        foreach ($employeeIds as $employeeId) {
            db()->insert('project_employees', [
                'project_id' => $id,
                'employee_id' => $employeeId,
            ]);
        }
    }
    
    $employees = db()->fetchAll(
        "SELECT employee_id FROM project_employees WHERE project_id = ?",
        [$id]
    );
    
    $project = db()->fetchOne("SELECT * FROM projects WHERE id = ?", [$id]);
    
    jsonResponse(['project' => formatProject($project, array_column($employees, 'employee_id'))]);
}

function deleteProject(string $id) {
    $authUser = requireAdmin();
    
    $project = db()->fetchOne("SELECT id FROM projects WHERE id = ?", [$id]);
    if (!$project) {
        errorResponse('Project not found', 404);
    }
    
    // Delete in order: comments -> tasks -> project_employees -> project
    $taskIds = db()->fetchAll("SELECT id FROM tasks WHERE project_id = ?", [$id]);
    $taskIdList = array_column($taskIds, 'id');
    
    if (!empty($taskIdList)) {
        $placeholders = implode(',', array_fill(0, count($taskIdList), '?'));
        db()->query("DELETE FROM comments WHERE task_id IN ({$placeholders})", $taskIdList);
    }
    
    db()->delete('tasks', 'project_id = ?', [$id]);
    db()->delete('project_employees', 'project_id = ?', [$id]);
    db()->delete('projects', 'id = ?', [$id]);
    
    jsonResponse(['message' => 'Project deleted successfully']);
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

function formatProject(array $project, array $employeeIds): array {
    return [
        'id' => $project['id'],
        'workspaceId' => $project['workspace_id'],
        'name' => $project['name'],
        'description' => $project['description'],
        'assignedEmployeeIds' => $employeeIds,
        'createdAt' => $project['created_at'],
    ];
}

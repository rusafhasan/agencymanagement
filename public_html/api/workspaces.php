<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setHeaders();

$method = getMethod();
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getWorkspace($id);
        } else {
            getAllWorkspaces();
        }
        break;
        
    case 'POST':
        createWorkspace();
        break;
        
    case 'PUT':
        if (!$id) {
            errorResponse('Workspace ID required');
        }
        updateWorkspace($id);
        break;
        
    case 'DELETE':
        if (!$id) {
            errorResponse('Workspace ID required');
        }
        deleteWorkspace($id);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllWorkspaces() {
    $authUser = requireAuth();
    
    if ($authUser['role'] === 'admin') {
        $workspaces = db()->fetchAll("SELECT * FROM workspaces ORDER BY created_at DESC");
    } elseif ($authUser['role'] === 'client') {
        $workspaces = db()->fetchAll(
            "SELECT * FROM workspaces WHERE client_id = ? ORDER BY created_at DESC",
            [$authUser['id']]
        );
    } else {
        // Employee - get workspaces where they have assigned projects
        $workspaces = db()->fetchAll(
            "SELECT DISTINCT w.* FROM workspaces w
             INNER JOIN projects p ON p.workspace_id = w.id
             INNER JOIN project_employees pe ON pe.project_id = p.id
             WHERE pe.employee_id = ?
             ORDER BY w.created_at DESC",
            [$authUser['id']]
        );
    }
    
    jsonResponse(['workspaces' => array_map('formatWorkspace', $workspaces)]);
}

function getWorkspace(string $id) {
    $authUser = requireAuth();
    
    $workspace = db()->fetchOne("SELECT * FROM workspaces WHERE id = ?", [$id]);
    
    if (!$workspace) {
        errorResponse('Workspace not found', 404);
    }
    
    // Check access
    if ($authUser['role'] !== 'admin' && $workspace['client_id'] !== $authUser['id']) {
        if ($authUser['role'] === 'employee') {
            $hasAccess = db()->fetchOne(
                "SELECT 1 FROM projects p
                 INNER JOIN project_employees pe ON pe.project_id = p.id
                 WHERE p.workspace_id = ? AND pe.employee_id = ?",
                [$id, $authUser['id']]
            );
            if (!$hasAccess) {
                errorResponse('Access denied', 403);
            }
        } else {
            errorResponse('Access denied', 403);
        }
    }
    
    jsonResponse(['workspace' => formatWorkspace($workspace)]);
}

function createWorkspace() {
    $authUser = requireAdmin();
    $input = getJsonInput();
    
    $name = sanitizeString($input['name'] ?? '');
    $clientId = $input['clientId'] ?? null;
    
    if (!$name) {
        errorResponse('Workspace name is required');
    }
    
    if (!$clientId) {
        errorResponse('Client ID is required');
    }
    
    // Verify client exists
    $client = db()->fetchOne("SELECT id FROM users WHERE id = ? AND role = 'client'", [$clientId]);
    if (!$client) {
        errorResponse('Client not found');
    }
    
    $workspaceId = generateUUID();
    
    db()->insert('workspaces', [
        'id' => $workspaceId,
        'name' => $name,
        'client_id' => $clientId,
        'created_at' => date('Y-m-d H:i:s'),
    ]);
    
    $workspace = db()->fetchOne("SELECT * FROM workspaces WHERE id = ?", [$workspaceId]);
    
    jsonResponse(['workspace' => formatWorkspace($workspace)], 201);
}

function updateWorkspace(string $id) {
    $authUser = requireAdmin();
    $input = getJsonInput();
    
    $workspace = db()->fetchOne("SELECT id FROM workspaces WHERE id = ?", [$id]);
    if (!$workspace) {
        errorResponse('Workspace not found', 404);
    }
    
    $name = sanitizeString($input['name'] ?? '');
    
    if (!$name) {
        errorResponse('Workspace name is required');
    }
    
    db()->update('workspaces', ['name' => $name], 'id = ?', [$id]);
    
    jsonResponse(['message' => 'Workspace updated successfully']);
}

function deleteWorkspace(string $id) {
    $authUser = requireAdmin();
    
    $workspace = db()->fetchOne("SELECT id FROM workspaces WHERE id = ?", [$id]);
    if (!$workspace) {
        errorResponse('Workspace not found', 404);
    }
    
    // Delete in order: comments -> tasks -> project_employees -> projects -> workspace
    $projectIds = db()->fetchAll("SELECT id FROM projects WHERE workspace_id = ?", [$id]);
    $projectIdList = array_column($projectIds, 'id');
    
    if (!empty($projectIdList)) {
        $placeholders = implode(',', array_fill(0, count($projectIdList), '?'));
        
        // Get task IDs
        $taskIds = db()->fetchAll("SELECT id FROM tasks WHERE project_id IN ({$placeholders})", $projectIdList);
        $taskIdList = array_column($taskIds, 'id');
        
        if (!empty($taskIdList)) {
            $taskPlaceholders = implode(',', array_fill(0, count($taskIdList), '?'));
            db()->query("DELETE FROM comments WHERE task_id IN ({$taskPlaceholders})", $taskIdList);
        }
        
        db()->query("DELETE FROM tasks WHERE project_id IN ({$placeholders})", $projectIdList);
        db()->query("DELETE FROM project_employees WHERE project_id IN ({$placeholders})", $projectIdList);
        db()->query("DELETE FROM projects WHERE workspace_id = ?", [$id]);
    }
    
    db()->delete('workspaces', 'id = ?', [$id]);
    
    jsonResponse(['message' => 'Workspace deleted successfully']);
}

function formatWorkspace(array $workspace): array {
    return [
        'id' => $workspace['id'],
        'name' => $workspace['name'],
        'clientId' => $workspace['client_id'],
        'createdAt' => $workspace['created_at'],
    ];
}

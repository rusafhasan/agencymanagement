<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setHeaders();

$method = getMethod();
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getRevenue($id);
        } else {
            getAllRevenues();
        }
        break;
        
    case 'POST':
        createRevenue();
        break;
        
    case 'PUT':
        if (!$id) {
            errorResponse('Revenue ID required');
        }
        updateRevenue($id);
        break;
        
    case 'DELETE':
        if (!$id) {
            errorResponse('Revenue ID required');
        }
        deleteRevenue($id);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllRevenues() {
    $authUser = requireAuth();
    
    // Only admin can see revenues
    if ($authUser['role'] !== 'admin') {
        $revenues = [];
    } else {
        $revenues = db()->fetchAll("SELECT * FROM revenues ORDER BY created_at DESC");
    }
    
    jsonResponse(['revenues' => array_map('formatRevenue', $revenues)]);
}

function getRevenue(string $id) {
    requireAdmin();
    
    $revenue = db()->fetchOne("SELECT * FROM revenues WHERE id = ?", [$id]);
    
    if (!$revenue) {
        errorResponse('Revenue not found', 404);
    }
    
    jsonResponse(['revenue' => formatRevenue($revenue)]);
}

function createRevenue() {
    requireAdmin();
    $input = getJsonInput();
    
    $clientId = $input['clientId'] ?? null;
    $projectId = $input['projectId'] ?? null;
    $amount = $input['amount'] ?? null;
    $currency = $input['currency'] ?? 'USD';
    $dateReceived = $input['dateReceived'] ?? date('Y-m-d');
    
    if (!$clientId || !$projectId || $amount === null) {
        errorResponse('Client ID, project ID, and amount are required');
    }
    
    // Verify client exists
    $client = db()->fetchOne("SELECT id FROM users WHERE id = ? AND role = 'client'", [$clientId]);
    if (!$client) {
        errorResponse('Client not found');
    }
    
    // Verify project exists
    $project = db()->fetchOne("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        errorResponse('Project not found');
    }
    
    $validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
    if (!in_array($currency, $validCurrencies)) {
        errorResponse('Invalid currency');
    }
    
    $revenueId = generateUUID();
    
    db()->insert('revenues', [
        'id' => $revenueId,
        'client_id' => $clientId,
        'project_id' => $projectId,
        'amount' => $amount,
        'currency' => $currency,
        'status' => 'pending',
        'date_received' => $dateReceived,
        'created_at' => date('Y-m-d H:i:s'),
    ]);
    
    $revenue = db()->fetchOne("SELECT * FROM revenues WHERE id = ?", [$revenueId]);
    
    jsonResponse(['revenue' => formatRevenue($revenue)], 201);
}

function updateRevenue(string $id) {
    requireAdmin();
    $input = getJsonInput();
    
    $revenue = db()->fetchOne("SELECT id FROM revenues WHERE id = ?", [$id]);
    if (!$revenue) {
        errorResponse('Revenue not found', 404);
    }
    
    $updates = [];
    
    if (isset($input['amount'])) {
        $updates['amount'] = $input['amount'];
    }
    
    if (isset($input['currency'])) {
        $validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
        if (!in_array($input['currency'], $validCurrencies)) {
            errorResponse('Invalid currency');
        }
        $updates['currency'] = $input['currency'];
    }
    
    if (isset($input['status'])) {
        $validStatuses = ['pending', 'paid'];
        if (!in_array($input['status'], $validStatuses)) {
            errorResponse('Invalid status');
        }
        $updates['status'] = $input['status'];
    }
    
    if (isset($input['dateReceived'])) {
        $updates['date_received'] = $input['dateReceived'];
    }
    
    if (empty($updates)) {
        errorResponse('No updates provided');
    }
    
    db()->update('revenues', $updates, 'id = ?', [$id]);
    
    $revenue = db()->fetchOne("SELECT * FROM revenues WHERE id = ?", [$id]);
    
    jsonResponse(['revenue' => formatRevenue($revenue)]);
}

function deleteRevenue(string $id) {
    requireAdmin();
    
    $revenue = db()->fetchOne("SELECT id FROM revenues WHERE id = ?", [$id]);
    if (!$revenue) {
        errorResponse('Revenue not found', 404);
    }
    
    db()->delete('revenues', 'id = ?', [$id]);
    
    jsonResponse(['message' => 'Revenue deleted successfully']);
}

function formatRevenue(array $revenue): array {
    return [
        'id' => $revenue['id'],
        'clientId' => $revenue['client_id'],
        'projectId' => $revenue['project_id'],
        'amount' => (float) $revenue['amount'],
        'currency' => $revenue['currency'],
        'status' => $revenue['status'],
        'dateReceived' => $revenue['date_received'],
        'createdAt' => $revenue['created_at'],
    ];
}

<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

setHeaders();

$method = getMethod();
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getPayment($id);
        } else {
            getAllPayments();
        }
        break;
        
    case 'POST':
        createPayment();
        break;
        
    case 'PUT':
        if (!$id) {
            errorResponse('Payment ID required');
        }
        updatePayment($id);
        break;
        
    case 'DELETE':
        if (!$id) {
            errorResponse('Payment ID required');
        }
        deletePayment($id);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllPayments() {
    $authUser = requireAuth();
    
    if ($authUser['role'] === 'admin') {
        $payments = db()->fetchAll("SELECT * FROM payments ORDER BY created_at DESC");
    } elseif ($authUser['role'] === 'employee') {
        $payments = db()->fetchAll(
            "SELECT * FROM payments WHERE employee_id = ? ORDER BY created_at DESC",
            [$authUser['id']]
        );
    } else {
        // Clients can't see payments
        $payments = [];
    }
    
    jsonResponse(['payments' => array_map('formatPayment', $payments)]);
}

function getPayment(string $id) {
    $authUser = requireAuth();
    
    $payment = db()->fetchOne("SELECT * FROM payments WHERE id = ?", [$id]);
    
    if (!$payment) {
        errorResponse('Payment not found', 404);
    }
    
    // Check access
    if ($authUser['role'] !== 'admin' && $payment['employee_id'] !== $authUser['id']) {
        errorResponse('Access denied', 403);
    }
    
    jsonResponse(['payment' => formatPayment($payment)]);
}

function createPayment() {
    requireAdmin();
    $input = getJsonInput();
    
    $employeeId = $input['employeeId'] ?? null;
    $projectId = $input['projectId'] ?? null;
    $amount = $input['amount'] ?? null;
    $currency = $input['currency'] ?? 'USD';
    $date = $input['date'] ?? date('Y-m-d');
    
    if (!$employeeId || !$projectId || $amount === null) {
        errorResponse('Employee ID, project ID, and amount are required');
    }
    
    // Verify employee exists
    $employee = db()->fetchOne("SELECT id FROM users WHERE id = ? AND role = 'employee'", [$employeeId]);
    if (!$employee) {
        errorResponse('Employee not found');
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
    
    $paymentId = generateUUID();
    
    db()->insert('payments', [
        'id' => $paymentId,
        'employee_id' => $employeeId,
        'project_id' => $projectId,
        'amount' => $amount,
        'currency' => $currency,
        'status' => 'unpaid',
        'date' => $date,
        'created_at' => date('Y-m-d H:i:s'),
    ]);
    
    $payment = db()->fetchOne("SELECT * FROM payments WHERE id = ?", [$paymentId]);
    
    jsonResponse(['payment' => formatPayment($payment)], 201);
}

function updatePayment(string $id) {
    requireAdmin();
    $input = getJsonInput();
    
    $payment = db()->fetchOne("SELECT id FROM payments WHERE id = ?", [$id]);
    if (!$payment) {
        errorResponse('Payment not found', 404);
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
        $validStatuses = ['unpaid', 'paid'];
        if (!in_array($input['status'], $validStatuses)) {
            errorResponse('Invalid status');
        }
        $updates['status'] = $input['status'];
    }
    
    if (isset($input['date'])) {
        $updates['date'] = $input['date'];
    }
    
    if (empty($updates)) {
        errorResponse('No updates provided');
    }
    
    db()->update('payments', $updates, 'id = ?', [$id]);
    
    $payment = db()->fetchOne("SELECT * FROM payments WHERE id = ?", [$id]);
    
    jsonResponse(['payment' => formatPayment($payment)]);
}

function deletePayment(string $id) {
    requireAdmin();
    
    $payment = db()->fetchOne("SELECT id FROM payments WHERE id = ?", [$id]);
    if (!$payment) {
        errorResponse('Payment not found', 404);
    }
    
    db()->delete('payments', 'id = ?', [$id]);
    
    jsonResponse(['message' => 'Payment deleted successfully']);
}

function formatPayment(array $payment): array {
    return [
        'id' => $payment['id'],
        'employeeId' => $payment['employee_id'],
        'projectId' => $payment['project_id'],
        'amount' => (float) $payment['amount'],
        'currency' => $payment['currency'],
        'status' => $payment['status'],
        'date' => $payment['date'],
        'createdAt' => $payment['created_at'],
    ];
}

<?php
/**
 * Installation Wizard API
 * Handles database setup and admin user creation
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check if already installed
function isInstalled(): bool {
    $configFile = __DIR__ . '/../api/config.php';
    if (!file_exists($configFile)) {
        return false;
    }
    
    $content = file_get_contents($configFile);
    return strpos($content, 'your_database_name') === false;
}

// Test database connection
function testConnection(string $host, string $name, string $user, string $pass): array {
    try {
        $pdo = new PDO(
            "mysql:host={$host};charset=utf8mb4",
            $user,
            $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        // Check if database exists
        $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = " . $pdo->quote($name));
        $dbExists = $stmt->fetch() !== false;
        
        return ['success' => true, 'dbExists' => $dbExists];
    } catch (PDOException $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Create database if it doesn't exist
function createDatabase(string $host, string $name, string $user, string $pass): array {
    try {
        $pdo = new PDO(
            "mysql:host={$host};charset=utf8mb4",
            $user,
            $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        return ['success' => true];
    } catch (PDOException $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Get embedded schema
function getSchema(): string {
    return "
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','employee','client') NOT NULL DEFAULT 'client',
  `disabled` tinyint(1) NOT NULL DEFAULT 0,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `profile_picture` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workspaces` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `workspaces_client_fk` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` varchar(36) NOT NULL,
  `workspace_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `workspace_id` (`workspace_id`),
  CONSTRAINT `projects_workspace_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_employees` (
  `project_id` varchar(36) NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  PRIMARY KEY (`project_id`, `employee_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `pe_project_fk` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pe_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('not-started','in-progress','needs-review','completed') NOT NULL DEFAULT 'not-started',
  `assigned_to` varchar(36) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `order_num` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `tasks_project_fk` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_user_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` varchar(36) NOT NULL,
  `task_id` varchar(36) NOT NULL,
  `author_id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `comments_task_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_author_fk` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` enum('USD','EUR','GBP','CAD','AUD') NOT NULL DEFAULT 'USD',
  `status` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `payments_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_project_fk` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `revenues` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` enum('USD','EUR','GBP','CAD','AUD') NOT NULL DEFAULT 'USD',
  `status` enum('pending','paid') NOT NULL DEFAULT 'pending',
  `date_received` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `revenues_client_fk` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `revenues_project_fk` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";
}

// Import schema
function importSchema(string $host, string $name, string $user, string $pass): array {
    try {
        $pdo = new PDO(
            "mysql:host={$host};dbname={$name};charset=utf8mb4",
            $user,
            $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $schema = getSchema();
        
        // Execute schema (split by semicolons for multiple statements)
        $statements = array_filter(array_map('trim', explode(';', $schema)));
        
        foreach ($statements as $statement) {
            if (!empty($statement)) {
                $pdo->exec($statement);
            }
        }
        
        return ['success' => true];
    } catch (PDOException $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Create admin user
function createAdmin(string $host, string $name, string $user, string $pass, string $email, string $adminName, string $adminPass): array {
    try {
        $pdo = new PDO(
            "mysql:host={$host};dbname={$name};charset=utf8mb4",
            $user,
            $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            return ['success' => false, 'error' => 'User with this email already exists'];
        }
        
        // Create admin user
        $hashedPassword = password_hash($adminPass, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'active')");
        $stmt->execute([$email, $adminName, $hashedPassword]);
        
        return ['success' => true];
    } catch (PDOException $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Generate random JWT secret
function generateSecret(): string {
    return bin2hex(random_bytes(32));
}

// Update config file
function updateConfig(string $host, string $name, string $user, string $pass, string $jwtSecret, string $adminEmail): array {
    $configFile = __DIR__ . '/../api/config.php';
    
    if (!is_writable(dirname($configFile))) {
        return ['success' => false, 'error' => 'Config directory is not writable'];
    }
    
    $config = "<?php
/**
 * Configuration File
 * Auto-generated by Installation Wizard
 */

// Database Configuration
define('DB_HOST', '{$host}');
define('DB_NAME', '{$name}');
define('DB_USER', '{$user}');
define('DB_PASS', '{$pass}');

// Security Configuration
define('JWT_SECRET', '{$jwtSecret}');
define('JWT_EXPIRY', 86400 * 7); // Token expiry in seconds (7 days)

// Application Settings
define('APP_NAME', 'Agency Dashboard');
define('ADMIN_EMAIL', '{$adminEmail}');

// CORS Settings
define('ALLOWED_ORIGINS', '*'); // Change to your domain in production

// Debug Mode (set to false in production)
define('DEBUG_MODE', false);
";

    if (file_put_contents($configFile, $config) === false) {
        return ['success' => false, 'error' => 'Failed to write config file'];
    }
    
    return ['success' => true];
}

// Handle requests
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'check':
        echo json_encode(['installed' => isInstalled()]);
        break;
        
    case 'test':
        if (empty($input['host']) || empty($input['name']) || empty($input['user'])) {
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            break;
        }
        echo json_encode(testConnection($input['host'], $input['name'], $input['user'], $input['pass'] ?? ''));
        break;
        
    case 'install':
        if (isInstalled()) {
            echo json_encode(['success' => false, 'error' => 'Application is already installed']);
            break;
        }
        
        $required = ['host', 'name', 'user', 'adminEmail', 'adminName', 'adminPass'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                echo json_encode(['success' => false, 'error' => "Missing required field: {$field}"]);
                exit;
            }
        }
        
        $host = $input['host'];
        $name = $input['name'];
        $user = $input['user'];
        $pass = $input['pass'] ?? '';
        $adminEmail = $input['adminEmail'];
        $adminName = $input['adminName'];
        $adminPass = $input['adminPass'];
        
        // Step 1: Create database
        $result = createDatabase($host, $name, $user, $pass);
        if (!$result['success']) {
            echo json_encode(['success' => false, 'error' => 'Failed to create database: ' . $result['error']]);
            break;
        }
        
        // Step 2: Import schema
        $result = importSchema($host, $name, $user, $pass);
        if (!$result['success']) {
            echo json_encode(['success' => false, 'error' => 'Failed to import schema: ' . $result['error']]);
            break;
        }
        
        // Step 3: Create admin user
        $result = createAdmin($host, $name, $user, $pass, $adminEmail, $adminName, $adminPass);
        if (!$result['success']) {
            echo json_encode(['success' => false, 'error' => 'Failed to create admin: ' . $result['error']]);
            break;
        }
        
        // Step 4: Update config
        $jwtSecret = generateSecret();
        $result = updateConfig($host, $name, $user, $pass, $jwtSecret, $adminEmail);
        if (!$result['success']) {
            echo json_encode(['success' => false, 'error' => 'Failed to update config: ' . $result['error']]);
            break;
        }
        
        echo json_encode(['success' => true, 'message' => 'Installation completed successfully']);
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
}

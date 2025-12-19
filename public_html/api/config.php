<?php
/**
 * Configuration File
 * Edit these settings before deploying to your server
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');

// Security Configuration
define('JWT_SECRET', 'change-this-to-a-long-random-string-at-least-32-characters');
define('JWT_EXPIRY', 86400 * 7); // Token expiry in seconds (default: 7 days)

// Application Settings
define('APP_NAME', 'Agency Dashboard');
define('ADMIN_EMAIL', 'admin@example.com'); // Default admin email for first user

// CORS Settings (add your domain)
define('ALLOWED_ORIGINS', '*'); // Change to your domain in production, e.g., 'https://yourdomain.com'

// Debug Mode (set to false in production)
define('DEBUG_MODE', false);

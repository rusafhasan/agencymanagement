# Agency Dashboard - Installation Guide

## Requirements
- PHP 7.4 or higher
- MySQL 5.7 or higher
- cPanel with File Manager access

## Installation Steps

### 1. Create MySQL Database
1. Log in to your cPanel
2. Go to **MySQL Databases**
3. Create a new database (e.g., `agency_db`)
4. Create a new user with a strong password
5. Add the user to the database with **ALL PRIVILEGES**

### 2. Import Database Schema
1. Go to **phpMyAdmin** in cPanel
2. Select your newly created database
3. Click the **Import** tab
4. Choose the `database/schema.sql` file
5. Click **Go** to import

### 3. Configure the Application
1. Navigate to `public_html/api/config.php`
2. Edit the following settings:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_database_user');
   define('DB_PASS', 'your_database_password');
   define('JWT_SECRET', 'change-this-to-a-long-random-string');
   ```

### 4. Upload Files
1. Go to **File Manager** in cPanel
2. Navigate to `public_html`
3. Upload the contents of the `public_html` folder from the ZIP

### 5. First Login
1. Visit your domain
2. Click "Sign Up" to create the first account
3. The first user automatically becomes **Admin**

## Folder Structure
```
public_html/
├── api/                  # PHP Backend API
│   ├── config.php        # ⚠️ Edit this file!
│   ├── db.php
│   ├── helpers.php
│   ├── auth.php
│   ├── users.php
│   ├── workspaces.php
│   ├── projects.php
│   ├── tasks.php
│   ├── comments.php
│   ├── payments.php
│   ├── revenues.php
│   └── .htaccess
├── assets/               # Built JS/CSS
├── index.html            # React App
└── .htaccess             # SPA Routing
```

## Troubleshooting

### "Database connection failed"
- Check database credentials in `config.php`
- Ensure MySQL user has proper permissions

### "500 Internal Server Error"
- Check PHP version (requires 7.4+)
- Verify `.htaccess` files are uploaded

### CORS Errors
- Edit `ALLOWED_ORIGINS` in `config.php` to your domain

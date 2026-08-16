# Paperly PHP deployment

This package runs Paperly on ordinary PHP shared hosting while keeping all PDF processing inside the visitor's browser.

The five tools keep the same browser-based workflow: Image to PDF, Merge PDF, PDF Unlocker, Compress PDF, and Split PDF. Open-password encrypted PDFs still require their correct password; PHP cannot bypass PDF encryption.

## Requirements

- PHP 8.1 or newer
- Apache with `mod_rewrite`
- HTTPS in production
- No Node.js runtime, Imagick, Ghostscript, or database is required

## cPanel installation

1. Upload the contents of `public_html/` into the domain's document root.
2. Upload `private/` one level above the public document root.
3. Rename `private/config.php.example` to `private/config.php`.
4. Set the admin email in `config.php`.
5. Generate a password hash in cPanel Terminal:

   `php -r "echo password_hash('YOUR_STRONG_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"`

6. Paste the generated hash into `admin_password_hash`.
7. Open the site and test `/image-to-pdf`, `/merge-pdf`, `/compress-pdf`, `/split-pdf`, and `/pdf-unlocker`.
8. Open `/admin/login` to test the PHP session login.

Do not place the `private/` directory inside the public document root. Keep a backup of its `config.php` before uploading future frontend builds.

If the domain document root cannot be changed, keep `private/` outside `public_html` and confirm that `index.php` and the API files resolve `../private/bootstrap.php` correctly.

## Local XAMPP test

Point an Apache virtual host document root to `php-dist/public_html`. The sibling folder `php-dist/private` must contain `config.php`.

For a quick local test from PowerShell, run this command from the project folder:

`C:\xampp\php\php.exe -S 127.0.0.1:4180 -t "C:\xampp\htdocs\PDF Converter\php-dist\public_html" "C:\xampp\htdocs\PDF Converter\php-dist\public_html\router.php"`

Then open `http://127.0.0.1:4180/` in the browser. Do not open `php-site/index.html` directly with a `file:///` address; it is Vite source and needs the PHP/web server.

The package exposes route-specific metadata, JSON-LD, `robots.txt`, and `sitemap.xml`. Long-form tool articles are server-rendered in PHP so search crawlers can read their content before JavaScript loads.

## Rebuild after frontend changes

Run `npm run php:build`. Upload the rebuilt `php-dist/public_html` files while preserving the server's existing `php-dist/private/config.php`.

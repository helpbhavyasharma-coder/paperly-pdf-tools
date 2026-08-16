<?php
declare(strict_types=1);

require dirname(__DIR__) . '/private/bootstrap.php';

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = rtrim($path, '/') ?: '/';
$isAdmin = $path === '/admin';
$isLogin = $path === '/admin/login';

if ($isAdmin && empty($_SESSION['paperly_admin'])) { header('Location: /admin/login', true, 302); exit; }
if ($isLogin && !empty($_SESSION['paperly_admin'])) { header('Location: /admin', true, 302); exit; }

$postsFile = dirname(__DIR__) . '/private/content/tool-posts.json';
$posts = is_file($postsFile) ? json_decode((string)file_get_contents($postsFile), true) : [];
$postsBySlug = [];
foreach (is_array($posts) ? $posts : [] as $post) { if (!empty($post['slug'])) $postsBySlug[(string)$post['slug']] = $post; }

$routes = [
  '/' => ['Paperly by Bhauu — Free, Private PDF Tools', 'Paperly is a free Bhauu PDF tools product for converting images, merging, unlocking, compressing and splitting PDFs without a watermark.'],
  '/image-to-pdf' => ['Image to PDF Converter — Free JPG, PNG, HEIC to PDF | Paperly', 'Convert JPG, PNG, WebP, HEIC and more into one PDF with Paperly, a free Bhauu PDF tool. Arrange pages, choose quality and add protection.'],
  '/merge-pdf' => ['Merge PDF Online Free — Combine PDF Files | Paperly', 'Merge PDFs into one organised document with Paperly, a free Bhauu PDF tool. Reorder files, set quality and protect the result.'],
  '/pdf-unlocker' => ['PDF Unlocker for Authorised Documents | Paperly', 'Remove supported PDF permission restrictions from authorised files with Paperly, a responsible browser-based Bhauu PDF tool.'],
  '/compress-pdf' => ['Compress PDF Online Free — Reduce PDF Size | Paperly', 'Reduce PDF size with Paperly, a free Bhauu PDF tool, while protecting readable text and useful image quality.'],
  '/split-pdf' => ['Split PDF Online Free — Extract PDF Pages | Paperly', 'Split PDFs by range or extract selected pages with Paperly, a free Bhauu PDF tool. Download separately or as a ZIP.'],
  '/blog' => ['Paperly & Bhauu Blog — PDF Tools, Software and Education', 'Detailed guides about Paperly PDF tools, Bhauu software company, Bhavya Sharma portfolio, Bhauu Edu and Quanta Classes.'],
  '/about' => ['About Paperly — Thoughtful, Free PDF Tools', 'Learn why Paperly builds simple browser-based PDF tools with no sign-up, no watermark and a privacy-conscious approach.'],
  '/contact' => ['Contact Paperly — Feedback and Tool Requests', 'Contact Paperly with questions, feedback, accessibility notes and ideas for useful PDF tools.'],
  '/privacy' => ['Privacy Policy | Paperly', 'Read how Paperly approaches browser-based PDF processing, file privacy and website data.'],
  '/terms' => ['Terms of Use | Paperly', 'Read the terms for using Paperly free browser-based PDF tools responsibly.'],
  '/admin/login' => ['Admin Login | Paperly', 'Private Paperly owner access.'],
  '/admin' => ['Admin | Paperly', 'Private Paperly owner dashboard.'],
];

$legacyRedirects = [
  '/blog/image-to-pdf-guide' => '/blog/image-to-pdf-complete-guide',
  '/blog/heic-to-pdf' => '/blog/image-to-pdf-complete-guide',
  '/blog/pdf-quality-guide' => '/blog/compress-pdf-complete-guide',
];
if (isset($legacyRedirects[$path])) { header('Location: ' . $legacyRedirects[$path], true, 301); exit; }

$slug = str_starts_with($path, '/blog/') ? substr($path, 6) : '';
$post = $postsBySlug[$slug] ?? null;
if ($post) $routes[$path] = [(string)$post['title'] . ' | Paperly', (string)$post['description']];

$host = preg_match('/^[a-z0-9.:-]+$/i', $_SERVER['HTTP_HOST'] ?? '') ? $_SERVER['HTTP_HOST'] : 'localhost';
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$origin = ($https ? 'https://' : 'http://') . $host;
$canonical = $origin . $path;

$publicPaths = array_values(array_filter(array_keys($routes), fn($route) => !str_starts_with($route, '/admin')));
foreach (array_keys($postsBySlug) as $postSlug) $publicPaths[] = '/blog/' . $postSlug;
$publicPaths = array_values(array_unique($publicPaths));

if ($path === '/robots.txt') {
  header('Content-Type: text/plain; charset=utf-8');
  echo "User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: {$origin}/sitemap.xml\n";
  exit;
}
if ($path === '/sitemap.xml') {
  header('Content-Type: application/xml; charset=utf-8');
  echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
  foreach ($publicPaths as $urlPath) {
    $loc = htmlspecialchars($origin . $urlPath, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $priority = $urlPath === '/' ? '1.0' : (str_starts_with($urlPath, '/blog/') ? '0.7' : '0.8');
    echo "  <url><loc>{$loc}</loc><lastmod>2026-08-16</lastmod><changefreq>monthly</changefreq><priority>{$priority}</priority></url>\n";
  }
  echo "</urlset>";
  exit;
}

if (!isset($routes[$path])) http_response_code(404);
[$title, $description] = $routes[$path] ?? ['Page not found | Paperly', 'The requested Paperly page could not be found.'];
$noindex = str_starts_with($path, '/admin') || !isset($routes[$path]);
$socialImage = $origin . (string)($post['image'] ?? '/og-tools.png');

$schema = ['@context' => 'https://schema.org', '@graph' => [
  ['@type' => 'WebSite', '@id' => $origin . '/#website', 'name' => 'Paperly', 'url' => $origin, 'description' => $routes['/'][1]],
  ['@type' => 'Organization', '@id' => $origin . '/#organization', 'name' => 'Paperly', 'url' => $origin, 'logo' => $origin . '/favicon.svg', 'parentOrganization' => ['@type'=>'Organization','name'=>'Bhauu','url'=>'https://bhauu.online/'], 'sameAs'=>['https://bhauu.online/','https://bhavyasharma.bhauu.online/']],
]];
if (in_array($path, ['/image-to-pdf','/merge-pdf','/pdf-unlocker','/compress-pdf','/split-pdf'], true)) {
  $schema = ['@context'=>'https://schema.org','@graph'=>[
    ['@type'=>'SoftwareApplication','name'=>str_replace(' | Paperly','',$title),'applicationCategory'=>'UtilitiesApplication','operatingSystem'=>'Any modern web browser','url'=>$canonical,'description'=>$description,'provider'=>['@type'=>'Organization','name'=>'Paperly by Bhauu','url'=>$origin],'offers'=>['@type'=>'Offer','price'=>'0','priceCurrency'=>'USD']],
    ['@type'=>'BreadcrumbList','itemListElement'=>[['@type'=>'ListItem','position'=>1,'name'=>'Home','item'=>$origin.'/'],['@type'=>'ListItem','position'=>2,'name'=>str_replace(' | Paperly','',$title),'item'=>$canonical]]],
  ]];
} elseif ($post) {
  $schema = ['@context'=>'https://schema.org','@graph'=>[
    ['@type'=>'BlogPosting','headline'=>$post['title'],'description'=>$post['description'],'image'=>$socialImage,'datePublished'=>$post['publishedAt'],'dateModified'=>$post['updatedAt'],'wordCount'=>$post['wordCount'],'about'=>['@type'=>$post['entityType'],'name'=>$post['entityName'],'url'=>$post['entityUrl']],'author'=>['@type'=>'Organization','name'=>'Paperly'],'publisher'=>['@type'=>'Organization','name'=>'Paperly'],'mainEntityOfPage'=>$canonical],
    ['@type'=>'BreadcrumbList','itemListElement'=>[['@type'=>'ListItem','position'=>1,'name'=>'Home','item'=>$origin.'/'],['@type'=>'ListItem','position'=>2,'name'=>'Blog','item'=>$origin.'/blog'],['@type'=>'ListItem','position'=>3,'name'=>$post['title'],'item'=>$canonical]]],
    ['@type'=>'FAQPage','mainEntity'=>array_map(fn($item)=>['@type'=>'Question','name'=>$item['question'],'acceptedAnswer'=>['@type'=>'Answer','text'=>$item['answer']]],$post['faq'])],
  ]];
}

$nonce = base64_encode(random_bytes(16));
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{$nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-cache, no-store, must-revalidate');

function e(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= e($title) ?></title>
  <meta name="description" content="<?= e($description) ?>">
  <meta name="robots" content="<?= $noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large' ?>">
  <link rel="canonical" href="<?= e($canonical) ?>">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="<?= $post ? 'article' : 'website' ?>">
  <meta property="og:site_name" content="Paperly">
  <meta property="og:title" content="<?= e($title) ?>">
  <meta property="og:description" content="<?= e($description) ?>">
  <meta property="og:url" content="<?= e($canonical) ?>">
  <meta property="og:image" content="<?= e($socialImage) ?>">
  <?php if ($post): ?><meta property="og:image:alt" content="<?= e((string)$post['imageAlt']) ?>"><?php endif; ?>
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="<?= e($title) ?>">
  <meta name="twitter:description" content="<?= e($description) ?>">
  <meta name="twitter:image" content="<?= e($socialImage) ?>">
  <script type="application/ld+json" nonce="<?= e($nonce) ?>"><?= json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?></script>
  <link rel="stylesheet" href="/assets/app.css?v=__PAPERLY_BUILD__">
</head>
<body>
  <div id="root">
    <?php if ($post): ?>
      <article class="seo-prerender"><p><?= e((string)$post['tag']) ?></p><h1><?= e((string)$post['title']) ?></h1><figure><img src="<?= e((string)$post['image']) ?>" alt="<?= e((string)$post['imageAlt']) ?>"></figure><p><?= e((string)$post['intro']) ?></p><?php foreach ($post['sections'] as $section): ?><section><h2><?= e((string)$section['heading']) ?></h2><?php foreach ($section['paragraphs'] as $paragraph): ?><p><?= e((string)$paragraph) ?></p><?php endforeach; ?></section><?php endforeach; ?><aside><h2>Related websites</h2><?php foreach ($post['relatedLinks'] as $link): ?><a href="<?= e((string)$link['href']) ?>"><?= e((string)$link['label']) ?></a> <?php endforeach; ?></aside><section><h2>Frequently asked questions</h2><?php foreach ($post['faq'] as $item): ?><h3><?= e((string)$item['question']) ?></h3><p><?= e((string)$item['answer']) ?></p><?php endforeach; ?></section></article>
    <?php elseif ($path === '/blog'): ?>
      <main><header class="page-hero shell"><p class="kicker">— PAPERLY JOURNAL · A BHAUU PROJECT</p><h1>Useful guides for files,<br><em>building and learning.</em></h1><p><?= e($description) ?></p></header><section class="blog-grid shell"><?php foreach ($posts as $blogPost): ?><a href="/blog/<?= e((string)$blogPost['slug']) ?>" class="blog-card"><img src="<?= e((string)$blogPost['image']) ?>" alt="<?= e((string)$blogPost['imageAlt']) ?>"><span><?= e((string)$blogPost['tag']) ?></span><h2><?= e((string)$blogPost['title']) ?></h2><p><?= e((string)$blogPost['description']) ?></p><small><?= e((string)$blogPost['wordCount']) ?> words · <?= e((string)$blogPost['readMinutes']) ?> min read</small><b>Read complete guide →</b></a><?php endforeach; ?></section></main>
    <?php elseif (!$noindex): ?>
      <main class="seo-prerender"><h1><?= e(preg_replace('/\s*[—|]\s*.*$/u', '', $title) ?: $title) ?></h1><p><?= e($description) ?></p></main>
    <?php endif; ?>
  </div>
  <script type="module" src="/assets/app.js?v=__PAPERLY_BUILD__"></script>
</body>
</html>

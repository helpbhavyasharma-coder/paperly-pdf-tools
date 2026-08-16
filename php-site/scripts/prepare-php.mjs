import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const source = path.join(root, "php-site/php");
const output = path.join(root, "php-dist");

await rm(path.join(output, "public_html/index.html"), { force: true });
await rm(path.join(output, "private"), { recursive: true, force: true });
await mkdir(path.join(output, "public_html/api"), { recursive: true });
await mkdir(path.join(output, "private"), { recursive: true });
await cp(path.join(source, "public_html"), path.join(output, "public_html"), { recursive: true, force: true });
await cp(path.join(source, "private"), path.join(output, "private"), { recursive: true, force: true });
await mkdir(path.join(output, "private/content"), { recursive: true });
const toolPosts = JSON.parse(await readFile(path.join(root, "app/blog/tool-posts.generated.json"), "utf8"));
const ecosystemPosts = JSON.parse(await readFile(path.join(root, "app/blog/ecosystem-posts.generated.json"), "utf8"));
await writeFile(path.join(output, "private/content/tool-posts.json"), `${JSON.stringify([...toolPosts, ...ecosystemPosts], null, 2)}\n`, "utf8");

const appJs = await readFile(path.join(output, "public_html/assets/app.js"));
const appCss = await readFile(path.join(output, "public_html/assets/app.css"));
const buildVersion = createHash("sha256").update(appJs).update(appCss).digest("hex").slice(0, 12);
const phpIndexPath = path.join(output, "public_html/index.php");
const phpIndex = await readFile(phpIndexPath, "utf8");
await writeFile(phpIndexPath, phpIndex.replaceAll("__PAPERLY_BUILD__", buildVersion), "utf8");

const readme = await readFile(path.join(root, "php-site/README.md"), "utf8");
await writeFile(path.join(output, "README.md"), readme, "utf8");
console.log(`PHP package ready: ${output}`);

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
await cp(path.join(root, "app/blog/tool-posts.generated.json"), path.join(output, "private/content/tool-posts.json"), { force: true });

const readme = await readFile(path.join(root, "php-site/README.md"), "utf8");
await writeFile(path.join(output, "README.md"), readme, "utf8");
console.log(`PHP package ready: ${output}`);

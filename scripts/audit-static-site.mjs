import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredRoutes = [
  "/",
  "/features",
  "/blog",
  "/blog/smarter-wardrobe",
  "/blog/ai-styling",
  "/blog/capsule-wardrobe",
  "/blog/wear-more-buy-less",
  "/blog/outfit-planning",
  "/blog/style-feedback",
  "/privacy",
  "/terms",
];

const expectedBlogPosts = [
  "/blog/smarter-wardrobe",
  "/blog/ai-styling",
  "/blog/capsule-wardrobe",
  "/blog/wear-more-buy-less",
  "/blog/outfit-planning",
  "/blog/style-feedback",
];

const failures = [];
const htmlFiles = [];

function fail(message) {
  failures.push(message);
}

function routeToFile(route) {
  if (route === "/") return path.join(root, "index.html");
  return path.join(root, route.slice(1), "index.html");
}

function existsFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(full);
  }
}

for (const route of requiredRoutes) {
  const file = routeToFile(route);
  if (!existsFile(file)) fail(`Missing route ${route} -> ${path.relative(root, file)}`);
}

walk(root);

const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
if (!/id=["']journal["']/.test(homepage)) {
  fail("Homepage is missing the journal/blog section (#journal).");
}
if (!/href=["']#journal["']/.test(homepage)) {
  fail("Primary navigation is missing an in-page Journal link.");
}
for (const post of expectedBlogPosts) {
  if (!homepage.includes(`href="${post}"`) && !homepage.includes(`href='${post}'`)) {
    fail(`Homepage journal is missing link to ${post}.`);
  }
}

if (/filter:\s*["']blur\(/.test(homepage)) {
  fail("GSAP still animates CSS filter blur, which is a common scroll-jank source.");
}
if (/will-change:\s*opacity,transform,filter/.test(homepage)) {
  fail("CSS still promotes filter animation with will-change.");
}
if (!/const\s+motionOK\s*=/.test(homepage)) {
  fail("Animation code is missing a motionOK guard for reduced-motion/mobile performance.");
}
if (!/ignoreMobileResize/.test(homepage)) {
  fail("ScrollTrigger mobile resize guard is missing.");
}
if (!/class=["']skip-link["'][^>]*data-native-skip/.test(homepage)) {
  fail("Skip link must bypass the offset smooth-scroll handler.");
}
if (/applyPrices\(PRICES\.SE\)/.test(homepage)) {
  fail("Homepage initializes pricing with missing PRICES.SE instead of PRICES.SEK.");
}

const localRefPattern = /\b(?:href|src)=["'](\/[^"']+)["']/g;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  let match;
  while ((match = localRefPattern.exec(html))) {
    const raw = match[1];
    if (raw.startsWith("//")) continue;
    const clean = raw.split("#")[0].split("?")[0];
    if (!clean || clean === "/auth" || clean === "/app") continue;
    const target = path.join(root, clean.slice(1));
    const routeFile = routeToFile(clean);
    const ok = existsFile(target) || existsFile(routeFile);
    if (!ok) fail(`${path.relative(root, file)} references missing local path ${raw}`);
  }
}

if (failures.length) {
  console.error(`FAIL static audit (${failures.length})`);
  for (const item of failures) console.error(` - ${item}`);
  process.exit(1);
}

console.log(`PASS static audit (${htmlFiles.length} HTML files checked)`);

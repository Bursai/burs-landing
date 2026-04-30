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
if (/gsap@|ScrollTrigger|lenis@|new Lenis|pin:true|scrub:/.test(homepage)) {
  fail("Landing page must not load or run scroll-jacking animation libraries.");
}
if (/requestAnimationFrame\(tick\)/.test(homepage)) {
  fail("Landing page still runs the custom cursor animation loop.");
}
if (!/class=["']skip-link["'][^>]*data-native-skip/.test(homepage)) {
  fail("Skip link must bypass the offset smooth-scroll handler.");
}
if (/applyPrices\(PRICES\.SE\)/.test(homepage)) {
  fail("Homepage initializes pricing with missing PRICES.SE instead of PRICES.SEK.");
}
if (/PRICES\.INTL/.test(homepage)) {
  fail("Homepage pricing fallback references missing PRICES.INTL.");
}

const weekGalleryImages = homepage.match(/<img[^>]+src=["']\/assets\/gallery\/week-[^"']+\.webp["'][^>]*class=["']gallery-img["'][^>]*>/g) || [];
if (weekGalleryImages.length !== 7) {
  fail("A week in BURS gallery must render seven generated image assets.");
}
if (/class=["']silhouette["']/.test(homepage)) {
  fail("A week in BURS gallery still uses placeholder silhouettes instead of generated photos.");
}
if (!/--gallery-x/.test(homepage) || !/galleryTrack\.style\.setProperty\("--gallery-x"/.test(homepage)) {
  fail("A week in BURS must keep its vertical-scroll-driven sideways gallery motion.");
}
if (!/position:sticky;top:0/.test(homepage) || !/--gallery-travel/.test(homepage)) {
  fail("A week in BURS gallery must use the lightweight sticky native scroll driver.");
}
if (!/nav\.scrolled\{[^}]*width:min\(/s.test(homepage) || !/nav\.scrolled\{[^}]*border-radius:999px/s.test(homepage)) {
  fail("Scrolled nav must become a minimized floating pill.");
}
if (!/\.edit-split\s+\.reveal\{opacity:1[^}]*transform:none/s.test(homepage)) {
  fail("Intro story section reveals must be static and immediately visible.");
}
if (/gsap\.to\("\.edit-img \.img"/.test(homepage)) {
  fail("Intro story image parallax should be disabled.");
}
if (!/id=["']week["'][^>]*class=["']gallery["']/.test(homepage)) {
  fail("A week in BURS section needs a stable #week anchor.");
}
if (!existsFile(path.join(root, "og-image-stylish.png"))) {
  fail("Stylish OG image asset is missing.");
}
if (!/og:image["'] content=["']https:\/\/burs\.me\/og-image-stylish\.png/.test(homepage) || !/twitter:image["'] content=["']https:\/\/burs\.me\/og-image-stylish\.png/.test(homepage)) {
  fail("Homepage social metadata must use the stylish OG image.");
}

for (const file of htmlFiles.filter((item) => item.includes(`${path.sep}blog${path.sep}`))) {
  const blogHtml = fs.readFileSync(file, "utf8");
  if (!/class=["']nav-logo["'][\s\S]*nl-mark[\s\S]*a quieter way to dress/.test(blogHtml)) {
    fail(`${path.relative(root, file)} blog header does not match the rebuilt landing nav brand lockup.`);
  }
  if (/How It Works|Get the App|https:\/\/www\.burs\.me\/auth/.test(blogHtml)) {
    fail(`${path.relative(root, file)} still contains old blog header copy or external auth CTA.`);
  }
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

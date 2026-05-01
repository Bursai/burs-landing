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

function fileSize(rel) {
  return fs.statSync(path.join(root, rel)).size;
}

function pngSize(rel) {
  const buffer = fs.readFileSync(path.join(root, rel));
  if (buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
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

if (/(?:^|[;{\s])filter:\s*blur\(/.test(homepage)) {
  fail("Landing page still uses CSS filter blur, which is a common scroll-jank source.");
}
if (/will-change:\s*filter/.test(homepage) || (homepage.match(/will-change:\s*transform/g) || []).length > 3) {
  fail("Landing page overuses persistent will-change or promotes filter animation.");
}
if (/preconnect["'][^>]+unpkg\.com/.test(homepage)) {
  fail("Homepage preconnects to unpkg even though no unpkg runtime is used.");
}
if (!/rel=["']preload["'][^>]+href=["']https:\/\/images\.unsplash\.com\/photo-1490481651871-ab68de25d43d\?w=1800&q=75&auto=format&fit=crop/.test(homepage)) {
  fail("Homepage hero image preload must match the optimized first-viewport CSS image URL.");
}
if (/gsap@|ScrollTrigger|lenis@|new Lenis|pin:true|scrub:/.test(homepage)) {
  fail("Landing page must not load or run scroll-jacking animation libraries.");
}
if (/requestAnimationFrame\(tick\)/.test(homepage)) {
  fail("Landing page still runs the custom cursor animation loop.");
}
if (/window\.__burshash[\s\S]*window\.scrollTo\(0,0\)/.test(homepage)) {
  fail("Hash navigation must not be forced back to the top of the page.");
}
if (/__burshash/.test(homepage)) {
  fail("Landing page must not keep stale hash-scroll override state.");
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
if (!/class=["']billing-toggle["']/.test(homepage) || !/data-billing=["']year["']/.test(homepage) || !/data-billing=["']month["']/.test(homepage)) {
  fail("Pricing section must include a monthly/yearly billing toggle.");
}
if (!/aria-pressed=/.test(homepage) || !/function applyBilling/.test(homepage)) {
  fail("Pricing billing toggle must expose pressed state and use a single applyBilling handler.");
}
if (!/data-price=["']active["']/.test(homepage) || !/data-price-period/.test(homepage)) {
  fail("Pricing card must update the active price and billing period in place.");
}
if (!/\.reveal\{\s*opacity:0;transform:translate3d/.test(homepage) || /\.motion-lite\s+\.reveal/.test(homepage)) {
  fail("Landing reveal animation has been flattened instead of using lightweight entrance motion.");
}
if (!/\.reveal\.is-visible/.test(homepage) || !/observe\(el\)/.test(homepage)) {
  fail("Landing reveal animation must be driven by IntersectionObserver.");
}
if (!/\.stage-act\.is-active/.test(homepage) || !/style\.setProperty\("--story-progress"/.test(homepage)) {
  fail("Five-act story must expose active-act styling and a scroll progress motion variable.");
}
if (!/function animateStatNumber/.test(homepage) || !/stats-grid \.stat-n/.test(homepage)) {
  fail("Stats banner must restore lightweight count-up animation.");
}
if (!/\.manifesto\.is-visible[\s\S]*\.word/.test(homepage) || !/style\.setProperty\("--word-i"/.test(homepage)) {
  fail("Manifesto must restore a staged word-by-word reveal.");
}
if (!/refreshParallaxMetrics/.test(homepage) || !/--hero-y/.test(homepage) || !/--edit-y/.test(homepage) || !/--magazine-y/.test(homepage)) {
  fail("Landing must restore native scroll-linked parallax for hero, editorial, and magazine sections.");
}
if (!/\.trip-frame\.is-visible/.test(homepage) || !/--trip-bg-y/.test(homepage) || !/--trip-phone-y/.test(homepage)) {
  fail("Triptych must restore frame entry and lightweight internal parallax.");
}
if (!/\.gallery-card\.is-visible/.test(homepage)) {
  fail("A week in BURS cards must restore viewport entry motion.");
}
if (!/footer\.is-visible[\s\S]*\.footer-top/.test(homepage) || !/\.dl-headline\.is-visible/.test(homepage)) {
  fail("Footer and final CTA must restore cinematic entry motion.");
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
if (!/\.gallery\{[^}]*touch-action:pan-y/s.test(homepage) || !/\.gallery-pin\{[^}]*touch-action:pan-y/s.test(homepage)) {
  fail("A week in BURS must preserve vertical touch scrolling while pinned.");
}
if (/addEventListener\(["']wheel["'][\s\S]*passive:false/.test(homepage)) {
  fail("Landing page must not use a global non-passive wheel listener.");
}
if (!/<div class=["']eye["']>A week in BURS<\/div>/.test(homepage)) {
  fail("A week in BURS text-fragment target must be exact text without a leading dash.");
}
if (!/location\.hash==="#week"\|\|location\.hash\.includes\("A%20week%20in%20BURS"\)/.test(homepage) || !/gallery\.scrollIntoView\(\{block:"start"\}\)/.test(homepage)) {
  fail("A week in BURS #week and text-fragment links must land on the gallery section.");
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
  if (!/id=["']mobile-drawer["'][^>]*aria-hidden=["']true["'][^>]*inert/.test(blogHtml)) {
    fail(`${path.relative(root, file)} mobile drawer must be inert while closed.`);
  }
  if (!/drawer\.toggleAttribute\('inert',!isOpen\)/.test(blogHtml)) {
    fail(`${path.relative(root, file)} mobile drawer must toggle inert with menu state.`);
  }
  if (!/class=["']nav-logo["'][\s\S]*nl-mark[\s\S]*a quieter way to dress/.test(blogHtml)) {
    fail(`${path.relative(root, file)} blog header does not match the rebuilt landing nav brand lockup.`);
  }
  if (/How It Works|Get the App|https:\/\/www\.burs\.me\/auth/.test(blogHtml)) {
    fail(`${path.relative(root, file)} still contains old blog header copy or external auth CTA.`);
  }
}
if (!/id=["']mobile-drawer["'][^>]*aria-hidden=["']true["'][^>]*inert/.test(homepage) || !/drawer\.toggleAttribute\('inert',!isOpen\)/.test(homepage)) {
  fail("Homepage mobile drawer must be inert while closed and toggle inert with menu state.");
}

for (const hero of fs.readdirSync(path.join(root, "assets", "blog")).filter((name) => name.endsWith("-hero.webp"))) {
  if (fileSize(path.join("assets", "blog", hero)) > 140_000) {
    fail(`${hero} exceeds the 140 KB blog hero WebP budget.`);
  }
}
for (const name of ["favicon-16.png", "favicon-32.png", "logo-48.png", "logo-128.png", "logo-256.png", "logo-512.png"]) {
  const expected = Number(name.match(/(?:favicon|logo)-(\d+)/)[1]);
  const actual = pngSize(name);
  if (!actual || actual.width !== expected || actual.height !== expected) {
    fail(`${name} must be a real ${expected}x${expected} PNG.`);
  }
}
if (!/"src": "\/og-image-stylish\.png"/.test(fs.readFileSync(path.join(root, "manifest.json"), "utf8"))) {
  fail("Manifest screenshot must use the optimized stylish OG image.");
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

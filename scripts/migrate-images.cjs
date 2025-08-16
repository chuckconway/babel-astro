#!/usr/bin/env node
// CommonJS version of migrate-images script (see migrate-images.js for description)

const fs = require("fs");
const path = require("path");
const { unified } = require("unified");
const _remarkParse = require("remark-parse");
const _remarkStringify = require("remark-stringify");
const remarkParse = _remarkParse.default || _remarkParse;
const remarkStringify = _remarkStringify.default || _remarkStringify;
const matter = require("gray-matter");
const { visit } = require("unist-util-visit");

const DRY_RUN = process.argv.includes("--dry-run");

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "src", "content", "posts");
// New home for inline images: public/assets/posts/{year}/...
const TARGET_BASE = path.join(ROOT, "public", "assets", "posts");
// Tracking sets for reporting
const referencedImages = new Set();
const copiedImages = new Set();
const missingImages = new Set();

/**
 * Copy a legacy image from src/images/posts/… into src/content/assets/posts/{year}/.
 * Returns the NEW relative path (POSIX style) as viewed from the Markdown file’s directory.
 * @param {string} legacyPath  The URL found in Markdown/front-matter (may start with ../../images/ …)
 * @param {number} year        Year sub-folder
 * @param {string} mdDir       Absolute directory of the Markdown file (used to compute relative path)
 */
function copyLegacyImage(legacyPath, year, mdDir) {
  if (!legacyPath) return null;

  referencedImages.add(legacyPath);

  // Normalise the legacy path so it starts with images/posts/…
  let trimmed = legacyPath
    // remove any number of leading ../ or ./ segments
    .replace(/^(?:\.\.\/|\.\/)+/, "")
    // remove leading slash
    .replace(/^\//, "");

  // Legacy references that started with /posts/… were in public uploads
  if (trimmed.startsWith("posts/")) {
    trimmed = path.join("images", trimmed); // treat them like src/images/posts/… for copy purposes
  }

  let sourcePath;
  if (trimmed.startsWith("images/")) {
    // images/posts/... lives under src/images
    sourcePath = path.join(ROOT, "src", trimmed);
  } else if (trimmed.startsWith("assets/posts/")) {
    // already migrated once; map back to src/images/posts
    const relativeUnderPosts = trimmed.replace(/^assets\/posts\//, "posts/");
    sourcePath = path.join(ROOT, "src", "images", relativeUnderPosts);
  } else {
    sourcePath = path.join(ROOT, trimmed);
  }

  if (!fs.existsSync(sourcePath)) {
    missingImages.add(legacyPath);
    console.warn(`⚠️  Source image not found: ${sourcePath}`);
    return null;
  }

  const targetDir = path.join(TARGET_BASE, String(year));
  const basename = path.basename(sourcePath);
  const targetPath = path.join(targetDir, basename);

  if (!DRY_RUN) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }

  copiedImages.add(legacyPath);
  // Return absolute site-root URL so Markdown renders <img src="/assets/posts/YYYY/foo.jpg">
  return `/assets/posts/${year}/${basename}`;
}

/**
 * Recursively walk a JS object/array and rewrite legacy image paths.
 * @param {object|array} node Front-matter node
 * @param {number} year
 * @returns {boolean} True if any value changed
 */
function rewriteFrontMatter(node, year, mdDir) {
  let changed = false;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const val = node[i];
      if (typeof val === "string" && isLegacyImage(val)) {
        const newRel = copyLegacyImage(val, year, mdDir);
        if (newRel) {
          node[i] = newRel;
          changed = true;
        }
      } else if (typeof val === "object" && val !== null) {
        changed = rewriteFrontMatter(val, year, mdDir) || changed;
      }
    }
  } else if (typeof node === "object" && node !== null) {
    for (const key of Object.keys(node)) {
      const val = node[key];
      if (typeof val === "string" && isLegacyImage(val)) {
        const newRel = copyLegacyImage(val, year, mdDir);
        if (newRel) {
          node[key] = newRel;
          changed = true;
        }
      } else if (typeof val === "object" && val !== null) {
        changed = rewriteFrontMatter(val, year, mdDir) || changed;
      }
    }
  }
  return changed;
}

function getMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) return getMarkdownFiles(p);
    return entry.isFile() && p.endsWith(".md") ? [p] : [];
  });
}

function isLegacyImage(url) {
  return (
    url.includes("images/posts/") ||
    url.includes("assets/posts/") ||
    url.startsWith("/posts/") ||
    url.startsWith("/wp-content/") ||
    url.startsWith("/201")
  );
}

function migrateFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(raw);
  const year = (() => {
    try {
      return new Date(data.date || data.pubDate || data.publishedDate).getFullYear();
    } catch {
      return new Date().getFullYear();
    }
  })();

  const processor = unified().use(remarkParse).use(remarkStringify, { fences: true });
  const tree = processor.parse(content);
  let modified = false;

  // 1. Rewrite image nodes in Markdown AST
  visit(tree, "image", (node) => {
    const currentUrl = node.url || "";
    let newRel = null;

    if (isLegacyImage(currentUrl)) {
      newRel = copyLegacyImage(currentUrl, year, path.dirname(filePath));
    } else if (currentUrl.startsWith("/images/posts/") || currentUrl.startsWith("./images/") || currentUrl.startsWith("../../images/")) {
      // Fix previously incorrect migration path
      const base = path.basename(currentUrl);
      newRel = `../../images/posts/${year}/${base}`;
    }

    if (newRel && newRel !== currentUrl) {
      node.url = newRel;
      modified = true;
    }
  });

  // 2. Rewrite legacy paths inside raw HTML blocks (<img src="…">)
  visit(tree, "html", (node) => {
    let replaced = node.value;
    replaced = replaced.replace(/<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (full, pre, src, post) => {
      if (!isLegacyImage(src)) return full; // leave untouched
      const newRel = copyLegacyImage(src, year, path.dirname(filePath));
      if (!newRel) return full; // missing image
      modified = true;
      return `<img${pre}src="${newRel}"${post}>`;
    });
    if (replaced !== node.value) {
      node.value = replaced;
    }
  });

  // update front-matter previously incorrect paths starting with ./images/
  function fixIncorrectPath(str, yr) {
    if (str.includes("images/posts/")) {
      return `/assets/posts/${yr}/${path.basename(str)}`;
    }
    return str;
  }

  const fmChanged = rewriteFrontMatter(data, year, path.dirname(filePath));
  if (fmChanged) modified = true;
  // Re-run through all string values to fix incorrect paths
  if (!fmChanged) {
    for (const k of Object.keys(data)) {
      const v = data[k];
      if (typeof v === "string" && v.includes("images/posts/")) {
        data[k] = fixIncorrectPath(v, year);
        modified = true;
      }
    }
  }

  if (modified) {
    const newContent = processor.stringify(tree);
    const out = matter.stringify(newContent, data);
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, out);
    }
    console.log(`${DRY_RUN ? "[dry] " : ""}Migrated: ${path.relative(ROOT, filePath)}`);
  }
}

function run() {
  const mdFiles = getMarkdownFiles(CONTENT_DIR);
  if (mdFiles.length === 0) {
    console.log("No Markdown files found – nothing to migrate.");
    return;
  }
  mdFiles.forEach(migrateFile);
  console.log("\nMigration complete.");
  console.log(`Referenced images: ${referencedImages.size}`);
  console.log(`Copied images    : ${copiedImages.size}`);
  console.log(`Missing images   : ${missingImages.size}`);
  if (missingImages.size > 0) {
    console.log("Some referenced images are missing from public/:\n" + [...missingImages].join("\n"));
  }
  if (DRY_RUN) {
    console.log("Run again without --dry-run to apply changes.");
  }
}

run(); 
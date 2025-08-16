#!/usr/bin/env node
/* eslint-disable */
require('dotenv').config();
// Translate English markdown posts into other supported languages using Claude API.
// Usage: node scripts/translate.cjs [--dry-run]

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const matter = require("gray-matter");

// Load i18n config from built dist if available.
// If dist is not built yet, parse src/config.i18n.ts directly to extract language codes.
// As a last resort, derive from src/i18n/*.json to avoid TS imports.
let DEFAULT_LANG;
let SUPPORTED_LANGS;
const ROOT = path.join(__dirname, "..");
const I18N_DIR = path.join(ROOT, "src", "i18n");
try {
  ({ DEFAULT_LANG, SUPPORTED_LANGS } = require(path.join(ROOT, 'dist', 'config.i18n.js')));
} catch {
  DEFAULT_LANG = 'en';
  // Attempt to parse TS source directly for codes
  try {
    const CONFIG_TS = path.join(ROOT, 'src', 'config.i18n.ts');
    const tsSrc = fs.readFileSync(CONFIG_TS, 'utf8');
    const defMatch = tsSrc.match(/DEFAULT_LANG\s*=\s*["']([a-z-]+)["']/i);
    if (defMatch) DEFAULT_LANG = defMatch[1];

    const codeRegex = /code:\s*["']([a-z-]+)["']/gi;
    const discovered = [];
    let m;
    while ((m = codeRegex.exec(tsSrc)) !== null) {
      discovered.push(m[1]);
    }
    const uniqueCodes = Array.from(new Set(discovered.length ? discovered : [DEFAULT_LANG]));
    SUPPORTED_LANGS = uniqueCodes.map((code) => ({ code }));
  } catch {
    // Fallback: derive from existing JSON dictionaries
    try {
      const files = fs.readdirSync(I18N_DIR).filter((f) => f.endsWith('.json'));
      const codes = files.map((f) => path.basename(f, '.json'));
      const uniqueCodes = Array.from(new Set([DEFAULT_LANG, ...codes]));
      SUPPORTED_LANGS = uniqueCodes.map((code) => ({ code }));
    } catch {
      // Fallback minimal config
      SUPPORTED_LANGS = [{ code: DEFAULT_LANG }];
    }
  }
}

const DRY_RUN = process.argv.includes("--dry-run");

// Initialize Anthropic client if API key present
let anthropic = null;
if (process.env.CLAUDE_API_KEY) {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { Anthropic } = require("@anthropic-ai/sdk");
    anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  } catch (err) {
    console.warn("Anthropic SDK not available – falling back to stub translation.");
  }
} else {
  console.warn("CLAUDE_API_KEY not set – using stub translations");
}

const CONTENT_ROOT = path.join(ROOT, "src", "content");
const TRANSLATION_DIR = path.join(ROOT, "src", "content");
const MANIFEST_PATH = path.join(ROOT, "translations-manifest.json");
// I18N_DIR already defined above
const EN_DICT_PATH = path.join(I18N_DIR, "en.json");

/**
 * Compute SHA256 hash of given string.
 * @param {string} str
 */
function computeHash(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

/** Load manifest mapping source file path + lang -> hash */
function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}

/** Persist manifest back to disk */
function saveManifest(manifest) {
  if (!DRY_RUN) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  }
}

/**
 * Discover English markdown files recursively.
 * @param {string} dir
 * @returns {string[]}
 */
function getMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) return getMarkdownFiles(p);
    return entry.isFile() && p.endsWith(".md") ? [p] : [];
  });
}

/**
 * Placeholder translation using Claude.
 * Replace this with real API call when key is configured.
 * @param {string} inputMd
 * @param {string} targetLangCode
 * @returns {Promise<string>} translated markdown
 */
async function translateMarkdown(inputMd, targetLangCode) {
  if (!anthropic) {
    console.log(`[stub] Translating to ${targetLangCode} – ${inputMd.length} chars`);
    return inputMd + `\n\n<!-- Translated into ${targetLangCode} (stub) -->`;
  }

  const prompt = `You are a professional translator. Translate the following Markdown document from English to ${targetLangCode}.\n\nRequirements:\n- Preserve YAML front-matter, but translate the title, description, category, and tags.\n- When quoting YAML front-matter string values, use double quotes (") instead of single quotes.\n- Tags may be quoted; if quoted, use double quotes.\n- Block scalars (| or >-) are allowed; keep them as-is when present.\n- Do NOT translate URLs, code blocks, or image paths.\n- Keep Markdown formatting intact.\n- Return ONLY the translated content without any wrapper text or markers.\n\nDocument to translate:\n${inputMd}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8096,
    temperature: 0.2,
    system: "You are a helpful assistant.",
    messages: [{ role: "user", content: prompt }],
  });

  const output = msg.content?.[0]?.text ?? "";
  return output;
}

async function translateJSONObject(enObj, targetLangCode) {
  if (!anthropic) {
    const translated = {};
    for (const k of Object.keys(enObj)) {
      translated[k] = `[${targetLangCode}] ${enObj[k]}`;
    }
    return translated;
  }

  const prompt = `Translate the values of the following JSON object from English to ${targetLangCode}.\nOnly translate the values, keep the keys exactly as they are. Return valid JSON.\n\n${JSON.stringify(enObj, null, 2)}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    temperature: 0.2,
    system: "You are a helpful assistant that outputs JSON only.",
    messages: [{ role: "user", content: prompt }],
  });

  let outputText = msg.content?.[0]?.text ?? "{}";
  // In case Claude wraps json in markdown triple backticks
  outputText = outputText.replace(/^```json\s*|```$/g, "");
  try {
    return JSON.parse(outputText);
  } catch (err) {
    console.warn(`Failed to parse JSON translation for ${targetLangCode}, falling back to stub.`);
    const fallback = {};
    for (const k of Object.keys(enObj)) {
      fallback[k] = `[${targetLangCode}] ${enObj[k]}`;
    }
    return fallback;
  }
}

async function main() {
  const manifest = loadManifest();
  // Gather English markdown files outside language-prefixed folders
  const allMd = getMarkdownFiles(CONTENT_ROOT);
  const englishFiles = allMd.filter((p) => {
    const rel = path.relative(CONTENT_ROOT, p);
    const first = rel.split(path.sep)[0];
    return !SUPPORTED_LANGS.some((l) => l.code === first);
  });
  if (englishFiles.length === 0) {
    console.log("No English markdown files found – nothing to translate.");
    return;
  }

  const tasks = [];

  // --- JSON dictionary tasks ---
  const enDictRaw = fs.readFileSync(EN_DICT_PATH, "utf8");
  const enHash = computeHash(enDictRaw);
  for (const { code } of SUPPORTED_LANGS) {
    if (code === DEFAULT_LANG) continue;
    const destJson = path.join(I18N_DIR, `${code}.json`);
    const key = `i18n_json::${code}`;
    const prevHash = manifest[key];
    if (!fs.existsSync(destJson) || prevHash !== enHash) {
      tasks.push({ type: "json", code, destJson, enDictRaw, enHash, key });
    }
  }

  for (const engPath of englishFiles) {
    const relPath = path.relative(CONTENT_ROOT, engPath);
    const raw = fs.readFileSync(engPath, "utf8");
    const hash = computeHash(raw);

    for (const { code } of SUPPORTED_LANGS) {
      if (code === DEFAULT_LANG) continue;
      const destPath = path.join(TRANSLATION_DIR, code, relPath);
      const destDir = path.dirname(destPath);
      const key = `${relPath}::${code}`;
      const prevHash = manifest[key];

      const needsTranslation = !fs.existsSync(destPath) || prevHash !== hash;
      if (!needsTranslation) continue;

      tasks.push({ engPath, relPath, destDir, destPath, code, hash });
    }
  }

  if (tasks.length === 0) {
    console.log("✅ All translations up to date.");
    return;
  }

  console.log(`📝 ${tasks.length} translation(s) needed (posts + ui).`);

  for (const t of tasks) {
    if (t.type === "json") {
      // Translate each value in the JSON object (stub)
      const enObj = JSON.parse(t.enDictRaw);
      const translatedObj = await translateJSONObject(enObj, t.code);
      if (!DRY_RUN) {
        fs.writeFileSync(t.destJson, JSON.stringify(translatedObj, null, 2));
        manifest[t.key] = t.enHash;
      }
      console.log(`${DRY_RUN ? "[dry] " : ""}Translated UI -> ${path.relative(ROOT, t.destJson)}`);
    } else {
      fs.mkdirSync(t.destDir, { recursive: true });
      const srcMd = fs.readFileSync(t.engPath, "utf8");
      const translated = await translateMarkdown(srcMd, t.code);
      if (!DRY_RUN) {
        fs.writeFileSync(t.destPath, translated);
        manifest[`${t.relPath}::${t.code}`] = t.hash;
      }
      console.log(`${DRY_RUN ? "[dry] " : ""}Translated -> ${path.relative(ROOT, t.destPath)}`);
    }
  }

  saveManifest(manifest);
  console.log("✨ Translation script finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 
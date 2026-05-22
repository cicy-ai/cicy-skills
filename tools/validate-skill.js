#!/usr/bin/env node
// tools/validate-skill.js
//
// Validate a single skill directory against the cicy-skills v2 spec.
// Zero npm dependencies (uses only Node built-ins).
//
// Usage:
//   node tools/validate-skill.js skills/cping
//   node tools/validate-skill.js skills/cping --json
//
// Exit codes:
//   0 — all checks passed
//   2 — validation failed (errors printed)
//   3 — usage / IO error

import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── arg parsing ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const json = argv.includes('--json');
const positional = argv.filter((a) => !a.startsWith('--'));
const skillDir = positional[0];

if (!skillDir) {
  process.stderr.write('usage: validate-skill.js <skill-dir> [--json]\n');
  process.exit(3);
}

const SKILL_DIR = resolve(skillDir);
const SKILL_NAME = basename(SKILL_DIR);

// ── result accumulator ─────────────────────────────────────────────────────

const errors = [];
const warnings = [];

const err = (code, message, hint) => errors.push({ code, message, hint });
const warn = (code, message, hint) => warnings.push({ code, message, hint });

// ── load schema ────────────────────────────────────────────────────────────

const SCHEMA_PATH = resolve(
  fileURLToPath(import.meta.url),
  '..',
  '..',
  'schemas',
  'manifest.schema.json',
);

let schema;
try {
  schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
} catch (e) {
  process.stderr.write(`failed to load schema ${SCHEMA_PATH}: ${e.message}\n`);
  process.exit(3);
}

// ── checks ─────────────────────────────────────────────────────────────────

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    err('READ_JSON', `cannot read ${path}: ${e.message}`);
    return null;
  }
}

function fileExists(rel) {
  return existsSync(join(SKILL_DIR, rel));
}

function fileSize(rel) {
  try {
    return statSync(join(SKILL_DIR, rel)).size;
  } catch {
    return -1;
  }
}

// 1. manifest.json
if (!fileExists('manifest.json')) {
  err('MISSING_FILE', 'manifest.json is required');
  finish();
}

const manifest = readJSON(join(SKILL_DIR, 'manifest.json'));
if (!manifest) finish();

// 2. schema validation (lightweight, only checks fields in our schema)
validateAgainstSchema(manifest, schema, '');

// 3. name == directory
if (manifest.name !== SKILL_NAME) {
  err(
    'NAME_MISMATCH',
    `manifest.name="${manifest.name}" must equal directory name "${SKILL_NAME}"`,
  );
}

// 4. SKILL.md exists, frontmatter matches
if (!fileExists('SKILL.md')) {
  err('MISSING_FILE', 'SKILL.md is required');
} else {
  const content = readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8');
  const fm = parseFrontmatter(content);
  if (!fm) {
    err('SKILL_MD_FRONTMATTER', 'SKILL.md must start with --- frontmatter ---');
  } else {
    if (fm.name !== manifest.name) {
      err(
        'SKILL_MD_NAME',
        `SKILL.md frontmatter name="${fm.name}" must equal manifest.name="${manifest.name}"`,
      );
    }
    if (fm.description !== manifest.description) {
      err(
        'SKILL_MD_DESC',
        'SKILL.md frontmatter description must equal manifest.description',
      );
    }
  }
}

// 5. README.md exists
if (!fileExists('README.md')) {
  warn('MISSING_FILE', 'README.md is recommended');
}

// 6. entry exists, executable, has shebang
const entry = manifest.entry;
if (entry) {
  if (!fileExists(entry)) {
    err('MISSING_ENTRY', `entry file "${entry}" does not exist`);
  } else {
    try {
      const st = statSync(join(SKILL_DIR, entry));
      if (!(st.mode & 0o111)) {
        warn(
          'ENTRY_NOT_EXEC',
          `${entry} is not executable; run "chmod +x ${entry}"`,
        );
      }
      const head = readFileSync(join(SKILL_DIR, entry), 'utf8').slice(0, 64);
      if (!head.startsWith('#!/usr/bin/env node')) {
        err(
          'ENTRY_SHEBANG',
          `${entry} must start with "#!/usr/bin/env node"`,
        );
      }
    } catch (e) {
      err('ENTRY_STAT', `cannot stat ${entry}: ${e.message}`);
    }
  }
}

// 7. files map exists
if (manifest.files) {
  for (const [key, rel] of Object.entries(manifest.files)) {
    if (!fileExists(rel)) {
      warn('MISSING_DOC', `manifest.files.${key} → "${rel}" does not exist`);
    }
  }
}

// 8. npm_dependencies → package.json + package-lock.json
if (manifest.npm_dependencies) {
  if (!fileExists('package.json')) {
    err('MISSING_PACKAGE_JSON', 'npm_dependencies=true but package.json is missing');
  }
  if (!fileExists('package-lock.json')) {
    err(
      'MISSING_LOCKFILE',
      'npm_dependencies=true but package-lock.json is missing — commit it',
    );
  }
  // forbid lifecycle scripts
  if (fileExists('package.json')) {
    const pkg = readJSON(join(SKILL_DIR, 'package.json'));
    const forbidden = ['preinstall', 'install', 'postinstall', 'prepare'];
    for (const k of forbidden) {
      if (pkg?.scripts?.[k]) {
        err(
          'FORBIDDEN_SCRIPT',
          `package.json.scripts.${k} is forbidden (installer uses --ignore-scripts)`,
        );
      }
    }
  }
}

// 9. size limits
let totalSize = 0;
walk(SKILL_DIR, (p, st) => {
  // skip node_modules in size accounting (it's installed separately)
  if (p.includes(`${SKILL_DIR}/node_modules`)) return;
  if (p.includes(`${SKILL_DIR}/.git`)) return;
  totalSize += st.size;
});
const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // 10 MB
if (totalSize > MAX_SOURCE_BYTES) {
  err(
    'TOO_LARGE',
    `skill source is ${(totalSize / 1024 / 1024).toFixed(1)} MB, max 10 MB`,
  );
}

// 10. config.path must be under ~/cicy-ai/db/
if (manifest.config?.path && !manifest.config.path.startsWith('~/cicy-ai/db/')) {
  err(
    'BAD_CONFIG_PATH',
    `config.path "${manifest.config.path}" must start with "~/cicy-ai/db/"`,
  );
}

// 11. static scan: forbid eval / Function in entry file (best-effort)
if (entry && fileExists(entry)) {
  const src = readFileSync(join(SKILL_DIR, entry), 'utf8');
  if (/\beval\s*\(/.test(src)) {
    err('FORBIDDEN_EVAL', `${entry} contains eval(...)`);
  }
  if (/\bnew\s+Function\s*\(/.test(src)) {
    err('FORBIDDEN_NEW_FUNCTION', `${entry} contains new Function(...)`);
  }
}

finish();

// ── helpers ────────────────────────────────────────────────────────────────

function finish() {
  const ok = errors.length === 0;
  if (json) {
    process.stdout.write(
      JSON.stringify({ ok, skill: SKILL_NAME, errors, warnings }, null, 2) + '\n',
    );
  } else {
    if (ok) {
      process.stdout.write(`✓ ${SKILL_NAME} passed (${warnings.length} warnings)\n`);
    } else {
      process.stdout.write(`✗ ${SKILL_NAME} failed:\n`);
    }
    for (const e of errors) {
      process.stdout.write(`  ERROR  [${e.code}] ${e.message}\n`);
      if (e.hint) process.stdout.write(`         hint: ${e.hint}\n`);
    }
    for (const w of warnings) {
      process.stdout.write(`  WARN   [${w.code}] ${w.message}\n`);
    }
  }
  process.exit(ok ? 0 : 2);
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const obj = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (mm) obj[mm[1]] = mm[2].trim();
  }
  return obj;
}

function walk(dir, cb) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, cb);
    else cb(full, st);
  }
}

// ── lightweight JSON Schema validator (subset, draft-07) ──────────────────
// Supports: type, required, properties, additionalProperties, enum, pattern,
// minLength, maxLength, minimum, format(uri/date-time), items, default

function validateAgainstSchema(value, schema, path) {
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = jsType(value);
    if (!types.includes(actual)) {
      err('SCHEMA_TYPE', `${path || '<root>'}: expected ${types.join('|')}, got ${actual}`);
      return;
    }
  }
  if (schema.enum && !schema.enum.includes(value)) {
    err('SCHEMA_ENUM', `${path}: must be one of ${JSON.stringify(schema.enum)}`);
  }
  if (typeof value === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      err('SCHEMA_PATTERN', `${path}: does not match pattern ${schema.pattern}`);
    }
    if (schema.maxLength != null && value.length > schema.maxLength) {
      err('SCHEMA_MAXLEN', `${path}: longer than ${schema.maxLength}`);
    }
    if (schema.minLength != null && value.length < schema.minLength) {
      err('SCHEMA_MINLEN', `${path}: shorter than ${schema.minLength}`);
    }
    if (schema.format === 'uri' && !/^https?:\/\//.test(value)) {
      err('SCHEMA_URI', `${path}: not a valid http(s) URI`);
    }
    if (
      schema.format === 'date-time' &&
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)
    ) {
      err('SCHEMA_DATETIME', `${path}: not ISO-8601 date-time`);
    }
  }
  if (typeof value === 'number') {
    if (schema.minimum != null && value < schema.minimum) {
      err('SCHEMA_MIN', `${path}: less than ${schema.minimum}`);
    }
  }
  if (schema.type === 'object' && jsType(value) === 'object') {
    if (schema.required) {
      for (const k of schema.required) {
        if (!(k in value)) err('SCHEMA_REQUIRED', `missing required field: ${path ? path + '.' : ''}${k}`);
      }
    }
    if (schema.properties) {
      for (const [k, sub] of Object.entries(schema.properties)) {
        if (k in value) validateAgainstSchema(value[k], sub, path ? `${path}.${k}` : k);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const k of Object.keys(value)) {
        if (!(k in schema.properties)) {
          err('SCHEMA_EXTRA', `unknown field: ${path ? path + '.' : ''}${k}`);
        }
      }
    }
  }
  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    value.forEach((item, i) => {
      validateAgainstSchema(item, schema.items, `${path}[${i}]`);
    });
  }
}

function jsType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v; // 'string' | 'number' | 'boolean' | 'object' | 'undefined'
}

#!/usr/bin/env node
// strip-exit-codes.js — remove "## Exit codes" sections from all skills' md files
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKILLS_DIR = new URL('../skills', import.meta.url).pathname;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (name.endsWith('.md')) yield p;
  }
}

let modified = 0;
for (const file of walk(SKILLS_DIR)) {
  let content = readFileSync(file, 'utf8');
  // Match "## Exit codes" or "## Exit Codes" through to the next ## or EOF
  const re = /\n##\s+Exit\s+[Cc]odes?[\s\S]*?(?=\n##\s|$)/g;
  if (re.test(content)) {
    content = content.replace(re, '\n');
    // Collapse trailing whitespace
    content = content.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
    writeFileSync(file, content);
    console.log('cleaned:', file.replace(SKILLS_DIR + '/', ''));
    modified++;
  }
}
console.log(`\ndone — ${modified} files modified`);

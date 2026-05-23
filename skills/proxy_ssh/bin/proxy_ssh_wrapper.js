#!/usr/bin/env node
// proxy_ssh — Node wrapper that delegates to proxy_ssh (Python)
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (args.length === 0 || args.some(a => a === '--help' || a === '-h' || a === 'help')) {
  try { execFileSync('python3', [join(__dir, 'proxy_ssh'), '--help'], { stdio: 'inherit' }); } catch {}
  process.exit(0);
}
try {
  execFileSync('python3', [join(__dir, 'proxy_ssh'), ...args], { stdio: 'inherit' });
} catch (e) { process.exit(e.status ?? 1); }

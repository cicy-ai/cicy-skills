// Minimal fake cicy-code keystore API for tests. Prints its port, then serves.
import { createServer } from 'node:http';
const VALUES = { API_KEY: 's3cr3t-value-xyz', DB_PASS: 'pa55-word-abc' };
const server = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (req.headers.authorization !== 'Bearer test-token') return send(401, { detail: 'unauthorized' });
    if (req.method === 'GET' && req.url === '/api/keystore') {
      // A (buggy) server leaking `value` must still never reach the output.
      return send(200, { keys: [
        { key: 'API_KEY', note: 'OpenAI prod\nrotated monthly', has_value: true, updated_at: '2026-10-24T00:00:00Z', value: VALUES.API_KEY },
        { key: 'DB_PASS', note: 'Postgres', has_value: true, updated_at: '' },
        { key: 'EMPTY_ONE', note: '', has_value: false, updated_at: '' },
      ] });
    }
    if (req.method === 'POST' && req.url === '/api/keystore/resolve') {
      const keys = JSON.parse(body || '{}').keys || [];
      const missing = keys.filter((k) => !(k in VALUES));
      if (missing.length) return send(404, { detail: 'key not set: ' + missing.join(', ') });
      return send(200, { values: Object.fromEntries(keys.map((k) => [k, VALUES[k]])) });
    }
    send(404, { detail: 'not found' });
  });
});
server.listen(0, '127.0.0.1', () => process.stdout.write(server.address().port + '\n'));

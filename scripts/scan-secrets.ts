import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

interface SecretRule {
  name: string;
  pattern: RegExp;
}

const RULES: SecretRule[] = [
  {
    name: 'credentialed database URL',
    pattern: /\bpostgres(?:ql)?:\/\/[^:\s"'<>]+:[^@\s"'<>]+@[^/\s"'<>]+/gi,
  },
  {
    name: 'Supabase publishable or secret key',
    pattern: /\bsb_(?:publishable|secret)_[A-Za-z0-9_-]{16,}\b/g,
  },
  {
    name: 'JWT-like token',
    pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{16,}\b/g,
  },
];

const ALLOWED_FILES = new Set(['.env.example', 'scripts/scan-secrets.ts']);
const findings: Array<{ file: string; line: number; rule: string }> = [];

function scanSource(file: string, source: string) {
  if (ALLOWED_FILES.has(file)) return;

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const line = source.slice(0, match.index).split('\n').length;
      findings.push({ file, line, rule: rule.name });
    }
  }
}

if (process.argv.includes('--history')) {
  const objects = spawnSync('git', ['rev-list', '--objects', 'main'], {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });
  if (objects.status !== 0) {
    throw new Error(objects.stderr || 'Unable to list Git history objects.');
  }

  const scanned = new Set<string>();
  for (const entry of objects.stdout.split('\n').filter(Boolean)) {
    const separator = entry.indexOf(' ');
    if (separator === -1) continue;
    const objectId = entry.slice(0, separator);
    const file = entry.slice(separator + 1);
    if (ALLOWED_FILES.has(file) || scanned.has(objectId)) continue;
    scanned.add(objectId);

    const blob = spawnSync('git', ['cat-file', 'blob', objectId], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    if (blob.status === 0) scanSource(file, blob.stdout);
  }
} else {
  const listed = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { encoding: 'utf8' }
  );
  if (listed.status !== 0) {
    throw new Error(listed.stderr || 'Unable to list repository files.');
  }

  for (const file of listed.stdout.split('\0').filter(Boolean)) {
    let source: string;
    try {
      source = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    scanSource(file, source);
  }
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line}: possible ${finding.rule}`);
  }
  throw new Error(`Secret scan failed with ${findings.length} finding(s).`);
}

console.log(
  process.argv.includes('--history')
    ? 'Git history secret scan passed.'
    : 'Secret scan passed.'
);

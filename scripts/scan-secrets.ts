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
const listed = spawnSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { encoding: 'utf8' }
);
if (listed.status !== 0) {
  throw new Error(listed.stderr || 'Unable to list repository files.');
}

const findings: Array<{ file: string; line: number; rule: string }> = [];
for (const file of listed.stdout.split('\0').filter(Boolean)) {
  if (ALLOWED_FILES.has(file)) continue;

  let source: string;
  try {
    source = await readFile(file, 'utf8');
  } catch {
    continue;
  }

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const line = source.slice(0, match.index).split('\n').length;
      findings.push({ file, line, rule: rule.name });
    }
  }
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line}: possible ${finding.rule}`);
  }
  throw new Error(`Secret scan failed with ${findings.length} finding(s).`);
}

console.log('Secret scan passed.');

/**
 * SQL string literals must use single quotes. Double quotes mean identifiers in
 * standard SQL; SQLite only treats them as strings as a legacy fallback, which the
 * web build already rejects and a future expo-sqlite could too.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['api', 'utils', 'services', 'context', 'hooks'];
const DOUBLE_QUOTED_LITERAL = /(?:LIKE|=|<>|!=)\s*"[A-Za-z%_ ]+"/;
// Lines that are clearly SQL: a keyword that only appears in queries.
const SQLISH = /\b(SELECT|INSERT|UPDATE|DELETE|WHERE|FROM)\b|NOT LIKE|AND segmentID/;

function files(dir: string): string[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(rel);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}

test('no SQL string literal uses double quotes', () => {
  const offenders: string[] = [];
  for (const file of DIRS.flatMap(files)) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    let inSql = false;
    lines.forEach((line, i) => {
      if (SQLISH.test(line)) inSql = true;
      if (inSql && DOUBLE_QUOTED_LITERAL.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      if (/[`'"]\s*[,)]?\s*;?\s*$/.test(line) && !SQLISH.test(line)) inSql = false;
    });
  }
  expect(offenders).toEqual([]);
});

// React Native 0.86 removed StyleSheet.absoluteFillObject on iOS and Android
// (web still has it, so the browser preview hides the break). Spreading the
// missing helper silently drops position: 'absolute'.
test('no code uses the removed StyleSheet.absoluteFillObject', () => {
  const offenders = ['app', 'components', 'hooks', 'utils', 'services', 'context', 'constants']
    .flatMap(files)
    .filter((file) => fs.readFileSync(path.join(ROOT, file), 'utf8').includes('StyleSheet.absoluteFillObject'));
  expect(offenders).toEqual([]);
});

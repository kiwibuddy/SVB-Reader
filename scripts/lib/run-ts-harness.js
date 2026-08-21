/**
 * Run a throwaway harness against real app modules, without a bundler.
 *
 * The app's TypeScript is written for Metro: `@/` path aliases, JSON imported
 * as data, and (in places) `require()` inside ESM. Plain node handles none of
 * that. Rather than reimplement app logic in test scripts — which would let the
 * test pass while the app is broken — this copies the real modules to a temp
 * directory, rewrites just enough for node to load them, and runs the harness
 * there. The app source is never modified.
 *
 * Requires node 22+ for --experimental-strip-types.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

const REQUIRE_SHIM =
  "import { createRequire } from 'node:module';\n" +
  'const require = createRequire(import.meta.url);\n\n';

/** Rewrite Metro-isms into something node can load. */
function shim(source) {
  return (
    REQUIRE_SHIM +
    source
      // `import Data from '@/assets/data/x.json'` — node ESM would demand an
      // import attribute, so route it through require instead.
      .replace(
        /import\s+(\w+)\s+from\s+['"]@\/(.*?\.json)['"];?/g,
        (_m, name, rel) => `const ${name} = require('${path.join(ROOT, rel)}');`
      )
      // Type-only imports that are not written as `import type` survive
      // stripping and would fail to resolve. These carry no runtime value.
      .replace(/import\s*\{[^}]*\}\s*from\s*['"]@\/types['"];?/g, '')
      // `require('@/…')` inside a module body.
      .replace(/require\(\s*['"]@\//g, `require('${ROOT}/`)
  );
}

/**
 * @param {object}   opts
 * @param {string[]} opts.modules  Repo-relative .ts paths. Each is importable
 *                                 from the harness as `./<basename>.ts`.
 * @param {string}   opts.harness  ESM TypeScript source to run.
 * @returns {number} the harness process exit code
 */
function runTsHarness({ modules, harness }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'svb-harness-'));

  try {
    fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');

    for (const rel of modules) {
      const source = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      fs.writeFileSync(path.join(tmp, path.basename(rel)), shim(source));
    }

    fs.writeFileSync(path.join(tmp, 'harness.ts'), harness);

    execFileSync(process.execPath, ['--experimental-strip-types', 'harness.ts'], {
      cwd: tmp,
      stdio: 'inherit',
    });
    return 0;
  } catch (error) {
    return error.status ?? 1;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

module.exports = { runTsHarness, ROOT };

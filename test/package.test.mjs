import { test } from '@rstest/core';
import { execFileSync } from 'node:child_process';

for (const format of ['module', 'commonjs']) {
  test('package exports support ' + format, () => {
    const load =
      format === 'module'
        ? "await import('@b12k/vue3-router-gmc')"
        : "require('@b12k/vue3-router-gmc')";
    const run =
      format === 'module'
        ? 'await run();'
        : 'run().catch(() => process.exit(1));';
    execFileSync(
      process.execPath,
      [
        '--input-type=' + format,
        '--eval',
        `
      async function run() {
        const { getMatchedComponents } = ${load};
        const page = { name: 'Page', render() {} };
        const route = { matched: [{ components: { default: async () => ({ default: page }) }, mods: {} }] };
        const result = await getMatchedComponents(route);
        if (result.entering[0] !== page || result.leaving.length || result.staying.length) {
          throw new Error('Unexpected matched components');
        }
      }
      ${run}
    `,
      ],
      { cwd: new URL('..', import.meta.url), stdio: 'pipe' },
    );
  });
}

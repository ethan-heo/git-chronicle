import { describe, expect, it } from 'vitest';
import { filterDiffForSummary } from '../../src/extension/diffFilterService';

describe('diffFilterService', () => {
  it('omits known lockfiles while preserving the stat summary', () => {
    const diff = [
      ' src/index.ts      | 2 ++',
      ' pnpm-lock.yaml    | 8 ++++++++',
      ' 2 files changed, 10 insertions(+)',
      '',
      'diff --git a/src/index.ts b/src/index.ts',
      'index 1111111..2222222 100644',
      '--- a/src/index.ts',
      '+++ b/src/index.ts',
      '@@ -1 +1,2 @@',
      ' console.log("hello");',
      '+console.log("world");',
      'diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml',
      'index 3333333..4444444 100644',
      '--- a/pnpm-lock.yaml',
      '+++ b/pnpm-lock.yaml',
      '@@ -1 +1,2 @@',
      '-lock-old',
      '+lock-new',
    ].join('\n');

    expect(filterDiffForSummary(diff)).toContain(' pnpm-lock.yaml    | 8 ++++++++');
    expect(filterDiffForSummary(diff)).toContain('diff --git a/src/index.ts b/src/index.ts');
    expect(filterDiffForSummary(diff)).toContain('diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml\n[diff omitted: lockfile]');
    expect(filterDiffForSummary(diff)).not.toContain('+++ b/pnpm-lock.yaml');
  });

  it('omits build artifacts and generated files by path pattern', () => {
    const diff = [
      'dist/app.js | 2 ++',
      'src/app.min.js | 2 ++',
      '',
      'diff --git a/dist/app.js b/dist/app.js',
      '@@ -0,0 +1,2 @@',
      '+bundle',
      '+content',
      'diff --git a/src/app.min.js b/src/app.min.js',
      '@@ -0,0 +1,2 @@',
      '+minified',
      '+content',
    ].join('\n');

    const filtered = filterDiffForSummary(diff);

    expect(filtered).toContain('diff --git a/dist/app.js b/dist/app.js\n[diff omitted: build-artifact]');
    expect(filtered).toContain('diff --git a/src/app.min.js b/src/app.min.js\n[diff omitted: generated]');
  });

  it('omits oversized diff blocks that exceed 500 lines', () => {
    const oversizedBlock = [
      'diff --git a/src/huge.ts b/src/huge.ts',
      ...Array.from({ length: 501 }, (_, index) => `+line ${index + 1}`),
    ].join('\n');

    expect(filterDiffForSummary(oversizedBlock)).toBe(
      'diff --git a/src/huge.ts b/src/huge.ts\n[diff omitted: oversized]',
    );
  });

  it('keeps 500-line diff blocks intact', () => {
    const exactLimitBlock = [
      'diff --git a/src/limit.ts b/src/limit.ts',
      ...Array.from({ length: 499 }, (_, index) => `+line ${index + 1}`),
    ].join('\n');

    expect(filterDiffForSummary(exactLimitBlock)).toBe(exactLimitBlock);
  });
});

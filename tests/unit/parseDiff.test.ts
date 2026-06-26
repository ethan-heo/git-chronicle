import { describe, expect, it } from 'vitest';
import { parseDiff } from '../../src/webview/features/F03/parseDiff';

describe('parseDiff', () => {
  it('parses unified diff lines and line numbers', () => {
    const lines = parseDiff(`diff --git a/src/example.ts b/src/example.ts
index 1111111..2222222 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -2,3 +2,4 @@
 const name = 'Git';
-console.log(name);
+console.info(name);
+console.info('done');`);

    expect(lines).toEqual([
      {
        type: 'context',
        content: "const name = 'Git';",
        oldLineNumber: 2,
        newLineNumber: 2,
        tokens: [{ content: "const name = 'Git';" }],
      },
      {
        type: 'removed',
        content: 'console.log(name);',
        oldLineNumber: 3,
        newLineNumber: null,
        tokens: [{ content: 'console.log(name);' }],
      },
      {
        type: 'added',
        content: 'console.info(name);',
        oldLineNumber: null,
        newLineNumber: 3,
        tokens: [{ content: 'console.info(name);' }],
      },
      {
        type: 'added',
        content: "console.info('done');",
        oldLineNumber: null,
        newLineNumber: 4,
        tokens: [{ content: "console.info('done');" }],
      },
    ]);
  });

  it('treats plain file content as context when no hunk exists', () => {
    const lines = parseDiff('first line\nsecond line');

    expect(lines.map((line) => [line.type, line.content, line.oldLineNumber, line.newLineNumber])).toEqual([
      ['context', 'first line', null, 1],
      ['context', 'second line', null, 2],
    ]);
  });
});

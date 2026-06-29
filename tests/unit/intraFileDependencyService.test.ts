import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { analyzeSymbolGraph } from '../../src/extension/intraFileDependencyService';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('intraFileDependencyService', () => {
  it('includes jsdoc in js/ts symbol ranges', async () => {
    const repoPath = makeTempRepoPath();
    const filePath = 'src/example.ts';
    writeRepoFile(
      repoPath,
      filePath,
      `/**
 * example jsdoc
 */
export function foo() {
  return 1;
}
`,
    );

    const result = await analyzeSymbolGraph(repoPath, filePath, null);
    const foo = result.nodes.find((node) => node.name === 'foo');

    expect(foo).toMatchObject({ lineStart: 1, lineEnd: 6, kind: 'function', isExported: true });
  });

  it('extends python ranges through the end of the block', async () => {
    const repoPath = makeTempRepoPath();
    const filePath = 'src/example.py';
    writeRepoFile(
      repoPath,
      filePath,
      `def first():
    value = 1
    return value

def second():
    return 2
`,
    );

    const result = await analyzeSymbolGraph(repoPath, filePath, null);
    const first = result.nodes.find((node) => node.name === 'first');
    const second = result.nodes.find((node) => node.name === 'second');

    expect(first).toMatchObject({ lineStart: 1, lineEnd: 4 });
    expect(second).toMatchObject({ lineStart: 5, lineEnd: 7 });
  });

  it('extends go ranges through the matching closing brace', async () => {
    const repoPath = makeTempRepoPath();
    const filePath = 'src/example.go';
    writeRepoFile(
      repoPath,
      filePath,
      `package main

func outer() {
  if true {
    println("nested")
  }
}

func next() {
  println("done")
}
`,
    );

    const result = await analyzeSymbolGraph(repoPath, filePath, null);
    const outer = result.nodes.find((node) => node.name === 'outer');
    const next = result.nodes.find((node) => node.name === 'next');

    expect(outer).toMatchObject({ lineStart: 3, lineEnd: 7 });
    expect(next).toMatchObject({ lineStart: 9, lineEnd: 11 });
  });
});

function makeTempRepoPath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-author-explorer-'));
  tempDirs.push(dir);
  return dir;
}

function writeRepoFile(repoPath: string, filePath: string, content: string): void {
  const absolutePath = path.join(repoPath, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}

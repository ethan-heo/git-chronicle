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

  it('extracts rich ts symbol metadata for functions, classes, enums, and types', async () => {
    const repoPath = makeTempRepoPath();
    const filePath = 'src/example.ts';
    writeRepoFile(
      repoPath,
      filePath,
      `export interface UserShape {
  id?: string;
  load?(force?: boolean): Promise<void>;
}

export class UserService implements UserShape {
  private id?: string;
  static version?: number;

  public load?(force?: boolean): Promise<void> {
    return Promise.resolve();
  }
}

export function fetchUser(id?: string): Promise<UserService> {
  return Promise.resolve(new UserService());
}

export enum Status {
  PENDING = 'pending',
  ACTIVE = 'active',
}

export type UserDTO = { id: string; name: string; active: boolean };
`,
    );

    const result = await analyzeSymbolGraph(repoPath, filePath, null);

    expect(result.nodes.find((node) => node.name === 'fetchUser')).toMatchObject({
      signature: '(id?: string): Promise<UserService>',
      kind: 'function',
    });
    expect(result.nodes.find((node) => node.name === 'UserService')).toMatchObject({
      kind: 'class',
      members: [
        { name: 'id', visibility: '-', memberKind: 'attribute', isOptional: true, type: 'string' },
        { name: 'version', visibility: '+', memberKind: 'attribute', isOptional: true, type: 'number', isStatic: true },
        { name: 'load', visibility: '+', memberKind: 'operation', isOptional: true, params: 'force?: boolean', type: 'Promise<void>' },
      ],
    });
    expect(result.nodes.find((node) => node.name === 'UserShape')).toMatchObject({
      kind: 'interface',
      members: [
        { name: 'id', visibility: '+', memberKind: 'attribute', isOptional: true, type: 'string' },
        { name: 'load', visibility: '+', memberKind: 'operation', isOptional: true, params: 'force?: boolean', type: 'Promise<void>' },
      ],
    });
    expect(result.nodes.find((node) => node.name === 'Status')).toMatchObject({
      enumValues: ["PENDING = 'pending'", "ACTIVE = 'active'"],
    });
    expect(result.nodes.find((node) => node.name === 'UserDTO')).toMatchObject({
      typeAnnotation: '{ id: string; name: str…',
    });
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

  it('extracts python and go signatures or type annotations when available', async () => {
    const repoPath = makeTempRepoPath();
    writeRepoFile(
      repoPath,
      'src/example.py',
      `class UserService:
    def __init__(self, name: str):
        self._token: str = 'x'
        self.id: int = 1

    def __validate(self, payload: dict) -> bool:
        return True

def greet(name: str) -> str:
    return name

answer: int = 42
`,
    );
    writeRepoFile(
      repoPath,
      'src/example.go',
      `package main

type Person struct {
  Name string
  token string
}

var answer int = 42

func (p *Person) DisplayName(prefix string) string {
  return prefix + p.Name
}

func greet(name string) string {
  return name
}
`,
    );

    const pyResult = await analyzeSymbolGraph(repoPath, 'src/example.py', null);
    const goResult = await analyzeSymbolGraph(repoPath, 'src/example.go', null);

    expect(pyResult.nodes.find((node) => node.name === 'greet')).toMatchObject({ signature: '(name: str): str' });
    expect(pyResult.nodes.find((node) => node.name === 'UserService')).toMatchObject({
      members: [
        { name: '_token', visibility: '#', memberKind: 'attribute', type: 'str' },
        { name: 'id', visibility: '+', memberKind: 'attribute', type: 'int' },
        { name: '__init__', visibility: '+', memberKind: 'operation', params: 'name: str' },
        { name: '__validate', visibility: '-', memberKind: 'operation', params: 'payload: dict', type: 'bool' },
      ],
    });
    expect(pyResult.nodes.find((node) => node.name === 'answer')).toMatchObject({ typeAnnotation: ': int' });
    expect(goResult.nodes.find((node) => node.name === 'greet')).toMatchObject({ signature: '(name string): string' });
    expect(goResult.nodes.find((node) => node.name === 'answer')).toMatchObject({ typeAnnotation: ': int' });
    expect(goResult.nodes.find((node) => node.name === 'Person')).toMatchObject({
      kind: 'class',
      members: [
        { name: 'Name', visibility: '+', memberKind: 'attribute', type: 'string' },
        { name: 'token', visibility: '-', memberKind: 'attribute', type: 'string' },
        { name: 'DisplayName', visibility: '+', memberKind: 'operation', params: 'prefix string', type: 'string' },
      ],
    });
    expect(goResult.nodes.find((node) => node.name === 'DisplayName')).toBeUndefined();
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

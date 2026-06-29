import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import { fetchFileContentAtCommit } from './gitService';

type SymbolKind = 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'enum';
type SymbolDependencyKind = 'calls' | 'uses' | 'extends' | 'implements';

interface SymbolNode {
  id: string;
  name: string;
  kind: SymbolKind;
  lineStart: number;
  lineEnd: number;
  isExported: boolean;
}

interface SymbolEdge {
  from: string;
  to: string;
  kind: SymbolDependencyKind;
}

const SUPPORTED_FILE_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx|py|go)$/i;
const JS_TS_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i;
const PY_PATTERN = /\.py$/i;
const GO_PATTERN = /\.go$/i;

export async function analyzeSymbolGraph(
  repoPath: string,
  filePath: string,
  commitHash: string | null | undefined,
): Promise<{ nodes: SymbolNode[]; edges: SymbolEdge[]; fileContent: string }> {
  if (!SUPPORTED_FILE_PATTERN.test(filePath)) {
    return { nodes: [], edges: [], fileContent: '' };
  }

  const content = await readFileContent(repoPath, filePath, commitHash ?? '');
  if (content === null) {
    return { nodes: [], edges: [], fileContent: '' };
  }

  if (JS_TS_PATTERN.test(filePath)) {
    return { ...analyzeJsTs(content, filePath), fileContent: content };
  }
  if (PY_PATTERN.test(filePath)) {
    return { ...analyzePython(content), fileContent: content };
  }
  if (GO_PATTERN.test(filePath)) {
    return { ...analyzeGo(content), fileContent: content };
  }

  return { nodes: [], edges: [], fileContent: content };
}

async function readFileContent(repoPath: string, filePath: string, commitHash: string): Promise<string | null> {
  if (commitHash) {
    const content = await fetchFileContentAtCommit(repoPath, commitHash, filePath);
    if (content !== null) return content;
  }

  const absolutePath = path.resolve(repoPath, filePath);
  try {
    return await fs.promises.readFile(absolutePath, 'utf8');
  } catch {
    return null;
  }
}

function analyzeJsTs(content: string, filePath: string): { nodes: SymbolNode[]; edges: SymbolEdge[] } {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, filePath.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const nodes: SymbolNode[] = [];
  const byName = new Map<string, SymbolNode>();

  ts.forEachChild(sourceFile, (node) => {
    const symbol = extractJsTsNode(node, sourceFile);
    if (symbol) {
      nodes.push(symbol);
      byName.set(symbol.name, symbol);
    }
  });

  const edges: SymbolEdge[] = [];
  for (const node of sourceFile.statements) {
    const from = extractJsTsNode(node, sourceFile);
    if (!from) continue;
    collectJsTsEdges(node, from, byName, edges);
  }

  return { nodes, edges: dedupeEdges(edges) };
}

function extractJsTsNode(node: ts.Node, sourceFile: ts.SourceFile): SymbolNode | null {
  const lineStart = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile, true)).line + 1;
  const lineEnd = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  const isExported = ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) : false;

  if (ts.isFunctionDeclaration(node) && node.name) return makeNode(node.name.text, 'function', lineStart, lineEnd, isExported);
  if (ts.isClassDeclaration(node) && node.name) return makeNode(node.name.text, 'class', lineStart, lineEnd, isExported);
  if (ts.isInterfaceDeclaration(node)) return makeNode(node.name.text, 'interface', lineStart, lineEnd, isExported);
  if (ts.isTypeAliasDeclaration(node)) return makeNode(node.name.text, 'type', lineStart, lineEnd, isExported);
  if (ts.isEnumDeclaration(node)) return makeNode(node.name.text, 'enum', lineStart, lineEnd, isExported);
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    if (decl && ts.isIdentifier(decl.name)) {
      const kind: SymbolKind = (node.declarationList.flags & ts.NodeFlags.Const) !== 0 ? 'constant' : 'variable';
      return makeNode(decl.name.text, kind, lineStart, lineEnd, isExported);
    }
  }

  return null;
}

function collectJsTsEdges(node: ts.Node, from: SymbolNode, byName: Map<string, SymbolNode>, edges: SymbolEdge[]): void {
  if (ts.isClassDeclaration(node)) {
    node.heritageClauses?.forEach((clause) => {
      const kind: SymbolDependencyKind = clause.token === ts.SyntaxKind.ExtendsKeyword ? 'extends' : 'implements';
      clause.types.forEach((typeExpr) => {
        if (ts.isIdentifier(typeExpr.expression)) pushEdge(from, byName, edges, typeExpr.expression.text, kind);
      });
    });
  }

  const visit = (child: ts.Node): void => {
    if (ts.isIdentifier(child)) {
      const parent = child.parent;
      const kind: SymbolDependencyKind = parent && (ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === child ? 'calls' : 'uses';
      pushEdge(from, byName, edges, child.text, kind);
    }
    ts.forEachChild(child, visit);
  };

  ts.forEachChild(node, visit);
}

function analyzePython(content: string): { nodes: SymbolNode[]; edges: SymbolEdge[] } {
  const nodes: SymbolNode[] = [];
  const lines = content.split('\n');
  const blocks: Array<{ start: number; indent: number; nodeIndex: number }> = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const func = /^\s*def\s+([A-Za-z_]\w*)\s*\(/.exec(line);
    const cls = /^\s*class\s+([A-Za-z_]\w*)/.exec(line);
    const assign = /^\s*([A-Za-z_]\w*)\s*=/.exec(line);
    const indent = (line.match(/^\s*/)?.[0] ?? '').length;
    if (func) {
      blocks.push({ start: lineNumber, indent, nodeIndex: nodes.push(makeNode(func[1], 'function', lineNumber, lineNumber, false)) - 1 });
    }
    if (cls) {
      blocks.push({ start: lineNumber, indent, nodeIndex: nodes.push(makeNode(cls[1], 'class', lineNumber, lineNumber, false)) - 1 });
    }
    if (assign) nodes.push(makeNode(assign[1], 'variable', lineNumber, lineNumber, false));
  });

  for (const block of blocks) {
    nodes[block.nodeIndex].lineEnd = findPythonBlockEnd(lines, block.start, block.indent);
  }

  return { nodes, edges: [] };
}

function analyzeGo(content: string): { nodes: SymbolNode[]; edges: SymbolEdge[] } {
  const nodes: SymbolNode[] = [];
  const lines = content.split('\n');
  const blocks: Array<{ start: number; nodeIndex: number }> = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const func = /^\s*func\s+([A-Za-z_]\w*)\s*\(/.exec(line);
    const type = /^\s*type\s+([A-Za-z_]\w*)\s+/.exec(line);
    const variable = /^\s*var\s+([A-Za-z_]\w*)\s*=/.exec(line);
    const constant = /^\s*const\s+([A-Za-z_]\w*)\s*=/.exec(line);
    if (func) {
      blocks.push({ start: lineNumber, nodeIndex: nodes.push(makeNode(func[1], 'function', lineNumber, lineNumber, false)) - 1 });
    }
    if (type) nodes.push(makeNode(type[1], 'type', lineNumber, lineNumber, false));
    if (variable) nodes.push(makeNode(variable[1], 'variable', lineNumber, lineNumber, false));
    if (constant) nodes.push(makeNode(constant[1], 'constant', lineNumber, lineNumber, false));
  });

  for (const block of blocks) {
    nodes[block.nodeIndex].lineEnd = findGoBlockEnd(lines, block.start);
  }

  return { nodes, edges: [] };
}

function findPythonBlockEnd(lines: string[], startLine: number, startIndent: number): number {
  for (let index = startLine; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '') continue;
    const indent = (line.match(/^\s*/)?.[0] ?? '').length;
    if (indent <= startIndent) {
      return index;
    }
  }

  return lines.length;
}

function findGoBlockEnd(lines: string[], startLine: number): number {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inRawString = false;

  for (let index = startLine - 1; index < lines.length; index += 1) {
    const line = lines[index];
    let escaped = false;

    for (let charIndex = 0; charIndex < line.length; charIndex += 1) {
      const char = line[charIndex];
      const next = line[charIndex + 1];

      if (inRawString) {
        if (char === '`') inRawString = false;
        continue;
      }
      if (inSingleQuote) {
        if (!escaped && char === '\'') inSingleQuote = false;
        escaped = !escaped && char === '\\';
        continue;
      }
      if (inDoubleQuote) {
        if (!escaped && char === '"') inDoubleQuote = false;
        escaped = !escaped && char === '\\';
        continue;
      }

      if (char === '`') {
        inRawString = true;
        continue;
      }
      if (char === '\'') {
        inSingleQuote = true;
        continue;
      }
      if (char === '"') {
        inDoubleQuote = true;
        continue;
      }
      if (char === '/' && next === '/') break;
      if (char === '/' && next === '*') {
        const end = line.indexOf('*/', charIndex + 2);
        if (end === -1) break;
        charIndex = end + 1;
        continue;
      }
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0 && index >= startLine - 1) {
          return index + 1;
        }
      }
    }
  }

  return lines.length;
}

function makeNode(name: string, kind: SymbolKind, lineStart: number, lineEnd: number, isExported: boolean): SymbolNode {
  return { id: `${name}:${lineStart}`, name, kind, lineStart, lineEnd, isExported };
}

function pushEdge(from: SymbolNode, byName: Map<string, SymbolNode>, edges: SymbolEdge[], name: string, kind: SymbolDependencyKind): void {
  const target = byName.get(name);
  if (!target || target.id === from.id) return;
  edges.push({ from: from.id, to: target.id, kind });
}

function dedupeEdges(edges: SymbolEdge[]): SymbolEdge[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.from}->${edge.to}:${edge.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import { fetchFileContentAtCommit } from './gitService';
import { detectSourceLanguage } from './lang/fileExtensions';
import { createTsSourceFile } from './lang/tsSourceWalker';

type SymbolKind = 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'enum';
type ImportKind = 'named' | 'default' | 'namespace';
type SymbolDependencyKind = 'calls' | 'uses' | 'extends' | 'implements';
type MemberVisibility = '+' | '-' | '#';

interface SymbolMember {
  name: string;
  visibility: MemberVisibility;
  memberKind: 'attribute' | 'operation';
  isOptional?: boolean;
  type?: string;
  params?: string;
  isStatic?: boolean;
  isAbstract?: boolean;
}

interface SymbolNode {
  id: string;
  name: string;
  kind: SymbolKind;
  lineStart: number;
  lineEnd: number;
  isExported: boolean;
  nodeCategory: 'local' | 'import';
  modulePath?: string;
  importKind?: ImportKind;
  signature?: string;
  typeAnnotation?: string;
  members?: SymbolMember[];
  enumValues?: string[];
}

interface SymbolEdge {
  from: string;
  to: string;
  kind: SymbolDependencyKind;
}

const TYPE_TEXT_LIMIT = 24;
const ENUM_LIMIT = 6;

export async function analyzeSymbolGraph(
  repoPath: string,
  filePath: string,
  commitHash: string | null | undefined,
): Promise<{ nodes: SymbolNode[]; edges: SymbolEdge[]; fileContent: string }> {
  const language = detectSourceLanguage(filePath);
  if (!language) {
    return { nodes: [], edges: [], fileContent: '' };
  }

  const content = await readFileContent(repoPath, filePath, commitHash ?? '');
  if (content === null) {
    return { nodes: [], edges: [], fileContent: '' };
  }

  if (language === 'jsTs') {
    return { ...analyzeJsTs(content, filePath), fileContent: content };
  }
  if (language === 'python') {
    return { ...analyzePython(content), fileContent: content };
  }
  return { ...analyzeGo(content), fileContent: content };
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
  const sourceFile = createTsSourceFile(filePath, content);
  const nodes: SymbolNode[] = [];
  const byName = new Map<string, SymbolNode>();
  const nodeById = new Map<string, ts.Node>();

  ts.forEachChild(sourceFile, (node) => {
    const symbols = extractJsTsNodes(node, sourceFile);
    symbols.forEach((symbol) => {
      nodes.push(symbol);
      byName.set(symbol.name, symbol);
      if (symbol.nodeCategory === 'local') {
        nodeById.set(symbol.id, node);
      }
    });
  });

  const edges: SymbolEdge[] = [];
  for (const symbol of nodes) {
    if (symbol.nodeCategory !== 'local') continue;
    const sourceNode = nodeById.get(symbol.id);
    if (!sourceNode) continue;
    collectJsTsEdges(sourceNode, symbol, byName, edges);
  }

  return { nodes, edges: dedupeEdges(edges) };
}

function extractJsTsNodes(node: ts.Node, sourceFile: ts.SourceFile): SymbolNode[] {
  const lineStart = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile, true)).line + 1;
  const lineEnd = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  const isExported = ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) : false;

  if (ts.isFunctionDeclaration(node) && node.name) {
    return [makeLocalNode(node.name.text, 'function', lineStart, lineEnd, isExported, { signature: buildFunctionSignature(node, sourceFile) })];
  }
  if (ts.isClassDeclaration(node) && node.name) {
    return [makeLocalNode(node.name.text, 'class', lineStart, lineEnd, isExported, { members: extractClassMembers(node, sourceFile) })];
  }
  if (ts.isInterfaceDeclaration(node)) {
    return [makeLocalNode(node.name.text, 'interface', lineStart, lineEnd, isExported, { members: extractInterfaceMembers(node, sourceFile) })];
  }
  if (ts.isTypeAliasDeclaration(node)) {
    return [makeLocalNode(node.name.text, 'type', lineStart, lineEnd, isExported, { typeAnnotation: clampText(node.type.getText(sourceFile)) })];
  }
  if (ts.isEnumDeclaration(node)) {
    return [makeLocalNode(node.name.text, 'enum', lineStart, lineEnd, isExported, { enumValues: extractEnumValues(node, sourceFile) })];
  }
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    if (decl && ts.isIdentifier(decl.name)) {
      const kind: SymbolKind = (node.declarationList.flags & ts.NodeFlags.Const) !== 0 ? 'constant' : 'variable';
      const typeAnnotation = decl.type ? `: ${clampText(decl.type.getText(sourceFile))}` : undefined;
      return [makeLocalNode(decl.name.text, kind, lineStart, lineEnd, isExported, { typeAnnotation })];
    }
  }
  if (ts.isImportDeclaration(node)) {
    return extractImportNodes(node, lineStart, lineEnd);
  }

  return [];
}

function extractImportNodes(node: ts.ImportDeclaration, lineStart: number, lineEnd: number): SymbolNode[] {
  const modulePath = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : '';
  const importClause = node.importClause;
  if (!importClause) return [];

  const nodes: SymbolNode[] = [];
  if (importClause.name) {
    nodes.push(makeImportNode(importClause.name.text, lineStart, lineEnd, modulePath, 'default'));
  }

  const namedBindings = importClause.namedBindings;
  if (namedBindings && ts.isNamedImports(namedBindings)) {
    namedBindings.elements.forEach((element) => {
      nodes.push(makeImportNode(element.name.text, lineStart, lineEnd, modulePath, 'named'));
    });
  } else if (namedBindings && ts.isNamespaceImport(namedBindings)) {
    nodes.push(makeImportNode(namedBindings.name.text, lineStart, lineEnd, modulePath, 'namespace'));
  }

  return nodes;
}

function collectJsTsEdges(node: ts.Node, from: SymbolNode, byName: Map<string, SymbolNode>, edges: SymbolEdge[]): void {
  if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
    node.heritageClauses?.forEach((clause) => {
      const kind: SymbolDependencyKind = clause.token === ts.SyntaxKind.ExtendsKeyword ? 'extends' : 'implements';
      clause.types.forEach((typeExpr) => {
        if (ts.isIdentifier(typeExpr.expression)) pushEdge(from, byName, edges, typeExpr.expression.text, kind);
      });
    });
  }

  const visit = (child: ts.Node): void => {
    if (shouldSkipIdentifier(child, from, node)) {
      return;
    }

    if (ts.isIdentifier(child)) {
      const parent = child.parent;
      const kind: SymbolDependencyKind = parent && (ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === child ? 'calls' : 'uses';
      pushEdge(from, byName, edges, child.text, kind);
    }
    ts.forEachChild(child, visit);
  };

  ts.forEachChild(node, visit);
}

function shouldSkipIdentifier(node: ts.Node, symbol: SymbolNode, declarationNode: ts.Node): boolean {
  if (!ts.isIdentifier(node)) return false;
  if (node.text === symbol.name && node.parent === declarationNode) return true;

  const parent = node.parent;
  if (!parent) return false;

  if (
    (ts.isFunctionDeclaration(parent) ||
      ts.isClassDeclaration(parent) ||
      ts.isInterfaceDeclaration(parent) ||
      ts.isTypeAliasDeclaration(parent) ||
      ts.isEnumDeclaration(parent)) &&
    parent.name === node
  ) {
    return true;
  }

  if (ts.isVariableDeclaration(parent) && parent.name === node) {
    return true;
  }

  if (ts.isPropertyDeclaration(parent) || ts.isPropertySignature(parent) || ts.isMethodDeclaration(parent) || ts.isMethodSignature(parent)) {
    if (parent.name === node) {
      return true;
    }
  }

  if (ts.isParameter(parent) && parent.name === node) {
    return true;
  }

  if (ts.isImportSpecifier(parent) || ts.isImportClause(parent) || ts.isNamespaceImport(parent)) {
    return true;
  }

  return false;
}

function analyzePython(content: string): { nodes: SymbolNode[]; edges: SymbolEdge[] } {
  const nodes: SymbolNode[] = [];
  const lines = content.split('\n');
  const blocks: Array<{ start: number; indent: number; nodeIndex: number }> = [];
  const classes: Array<{ name: string; indent: number; startLine: number; nodeIndex: number }> = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const indent = (line.match(/^\s*/)?.[0] ?? '').length;
    const func = /^\s*def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?:/.exec(line);
    const cls = /^\s*class\s+([A-Za-z_]\w*)/.exec(line);
    const assign = /^\s*([A-Za-z_]\w*)\s*:\s*([^=]+?)\s*=/.exec(line) ?? /^\s*([A-Za-z_]\w*)\s*=/.exec(line);

    if (func && !isInsidePythonClass(indent, classes, lineNumber, lines)) {
      const signature = formatPythonSignature(func[2] ?? '', func[3]?.trim());
      blocks.push({ start: lineNumber, indent, nodeIndex: nodes.push(makeNode(func[1], 'function', lineNumber, lineNumber, false, { signature })) - 1 });
    }
    if (cls) {
      const nodeIndex = nodes.push(makeNode(cls[1], 'class', lineNumber, lineNumber, false, { members: [] })) - 1;
      blocks.push({ start: lineNumber, indent, nodeIndex });
      classes.push({ name: cls[1], indent, startLine: lineNumber, nodeIndex });
    }
    if (assign && indent === 0) {
      const typeAnnotation = assign[2] ? `: ${clampText(assign[2].trim())}` : undefined;
      nodes.push(makeNode(assign[1], 'variable', lineNumber, lineNumber, false, { typeAnnotation }));
    }
  });

  for (const block of blocks) {
    nodes[block.nodeIndex].lineEnd = findPythonBlockEnd(lines, block.start, block.indent);
  }
  for (const cls of classes) {
    const classNode = nodes[cls.nodeIndex];
    classNode.members = extractPythonClassMembers(lines, cls.startLine, classNode.lineEnd, cls.indent);
  }

  return { nodes, edges: [] };
}

function analyzeGo(content: string): { nodes: SymbolNode[]; edges: SymbolEdge[] } {
  const nodes: SymbolNode[] = [];
  const lines = content.split('\n');
  const blocks: Array<{ start: number; nodeIndex: number }> = [];
  let currentStruct: { name: string; members: SymbolMember[]; startLine: number } | null = null;
  const classNodeByName = new Map<string, SymbolNode>();
  const pendingGoMethods = new Map<string, SymbolMember[]>();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const func = /^\s*func(?:\s+\([^)]+\))?\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:([A-Za-z0-9_*[\].]+))?\s*\{/.exec(line);
    const method = /^\s*func\s+\(([^)]+)\)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:([A-Za-z0-9_*[\].]+))?\s*\{/.exec(line);
    const typeStruct = /^\s*type\s+([A-Za-z_]\w*)\s+struct\s*\{/.exec(line);
    const typeAlias = /^\s*type\s+([A-Za-z_]\w*)\s+(.+)$/.exec(line);
    const variable = /^\s*var\s+([A-Za-z_]\w*)(?:\s+([^=]+?))?\s*=/.exec(line);
    const constant = /^\s*const\s+([A-Za-z_]\w*)(?:\s+([^=]+?))?\s*=/.exec(line);

    if (currentStruct) {
      if (/^\s*\}/.test(line)) {
        const mergedMembers = [
          ...currentStruct.members,
          ...(pendingGoMethods.get(currentStruct.name) ?? []),
        ];
        const classNode = makeNode(currentStruct.name, 'class', currentStruct.startLine, lineNumber, false, { members: mergedMembers });
        nodes.push(classNode);
        classNodeByName.set(currentStruct.name, classNode);
        pendingGoMethods.delete(currentStruct.name);
        currentStruct = null;
      } else {
        const field = /^\s*([A-Za-z_]\w*)\s+(.+)$/.exec(line.trim());
        if (field) {
          currentStruct.members.push({
            name: field[1],
            visibility: /^[A-Z]/.test(field[1]) ? '+' : '-',
            memberKind: 'attribute',
            type: clampText(field[2].trim()),
          });
        }
      }
      return;
    }

    if (typeStruct) {
      currentStruct = { name: typeStruct[1], members: [], startLine: lineNumber };
      return;
    }

    if (method) {
      const receiver = extractGoReceiverType(method[1]);
      const goMethodMember: SymbolMember = {
        name: method[2],
        visibility: /^[A-Z]/.test(method[2]) ? '+' : '-',
        memberKind: 'operation',
        params: clampText(method[3].trim()),
        type: method[4] ? clampText(method[4].trim()) : undefined,
      };
      const receiverNode = classNodeByName.get(receiver);
      if (receiverNode) {
        receiverNode.members = [
          ...(receiverNode.members ?? []),
          goMethodMember,
        ];
      } else {
        pendingGoMethods.set(receiver, [...(pendingGoMethods.get(receiver) ?? []), goMethodMember]);
      }
      return;
    }

    if (func) {
      blocks.push({ start: lineNumber, nodeIndex: nodes.push(makeNode(func[1], 'function', lineNumber, lineNumber, false, { signature: formatGoSignature(func[2], func[3]) })) - 1 });
      return;
    }

    if (typeAlias && !typeStruct) {
      nodes.push(makeNode(typeAlias[1], 'type', lineNumber, lineNumber, false, { typeAnnotation: clampText(typeAlias[2].trim()) }));
    }
    if (variable) {
      nodes.push(makeNode(variable[1], 'variable', lineNumber, lineNumber, false, { typeAnnotation: variable[2] ? `: ${clampText(variable[2].trim())}` : undefined }));
    }
    if (constant) {
      nodes.push(makeNode(constant[1], 'constant', lineNumber, lineNumber, false, { typeAnnotation: constant[2] ? `: ${clampText(constant[2].trim())}` : undefined }));
    }
  });

  for (const block of blocks) {
    nodes[block.nodeIndex].lineEnd = findGoBlockEnd(lines, block.start);
  }

  return { nodes, edges: [] };
}

function extractClassMembers(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): SymbolMember[] {
  const members: SymbolMember[] = [];

  node.members.forEach((member) => {
    if ((ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member)) && member.name && isSupportedMemberName(member.name)) {
      const memberName = member.name.getText(sourceFile);
      const base = {
        name: memberName,
        visibility: getTsVisibility(member),
        isStatic: hasModifier(member, ts.SyntaxKind.StaticKeyword),
      };

      if (ts.isPropertyDeclaration(member)) {
        members.push({
          ...base,
          memberKind: 'attribute',
          isOptional: Boolean(member.questionToken),
          type: member.type ? clampText(member.type.getText(sourceFile)) : undefined,
        });
      } else {
        members.push({
          ...base,
          memberKind: 'operation',
          isOptional: Boolean(member.questionToken),
          params: clampText(formatParameterList(member.parameters, sourceFile)),
          type: member.type ? clampText(member.type.getText(sourceFile)) : undefined,
          isAbstract: hasModifier(member, ts.SyntaxKind.AbstractKeyword),
        });
      }
    }
  });

  return members;
}

function extractInterfaceMembers(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): SymbolMember[] {
  const members: SymbolMember[] = [];

  node.members.forEach((member) => {
    if ((ts.isPropertySignature(member) || ts.isMethodSignature(member)) && member.name && ts.isIdentifier(member.name)) {
      if (ts.isPropertySignature(member)) {
        members.push({
          name: member.name.text,
          visibility: '+',
          memberKind: 'attribute',
          isOptional: Boolean(member.questionToken),
          type: member.type ? clampText(member.type.getText(sourceFile)) : undefined,
        });
      } else {
        members.push({
          name: member.name.text,
          visibility: '+',
          memberKind: 'operation',
          isOptional: Boolean(member.questionToken),
          params: clampText(formatParameterList(member.parameters, sourceFile)),
          type: member.type ? clampText(member.type.getText(sourceFile)) : undefined,
        });
      }
    }
  });

  return members;
}

function extractEnumValues(node: ts.EnumDeclaration, sourceFile: ts.SourceFile): string[] {
  return node.members.slice(0, ENUM_LIMIT).map((member) => {
    const name = member.name.getText(sourceFile);
    if (!member.initializer) return name;
    return clampText(`${name} = ${member.initializer.getText(sourceFile)}`);
  });
}

function buildFunctionSignature(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string {
  const params = formatParameterList(node.parameters, sourceFile);
  const returnType = node.type ? node.type.getText(sourceFile) : inferJsDocReturn(node);
  return `(${params})${returnType ? `: ${returnType}` : ''}`;
}

function formatParameterList(parameters: readonly ts.ParameterDeclaration[], sourceFile: ts.SourceFile): string {
  return parameters.map((parameter) => {
    const name = `${parameter.name.getText(sourceFile)}${parameter.questionToken ? '?' : ''}`;
    const type = parameter.type?.getText(sourceFile) ?? inferJsDocParam(parameter, sourceFile);
    return type ? `${name}: ${type}` : name;
  }).join(', ');
}

function inferJsDocParam(parameter: ts.ParameterDeclaration, sourceFile: ts.SourceFile): string | undefined {
  const tag = ts.getJSDocParameterTags(parameter).at(0);
  if (!tag?.typeExpression) return undefined;
  return tag.typeExpression.getFullText(sourceFile).replace(/[{}]/g, '').trim();
}

function inferJsDocReturn(node: ts.FunctionDeclaration): string | undefined {
  return ts.getJSDocReturnType(node)?.getText();
}

function getTsVisibility(node: ts.Node): MemberVisibility {
  if (ts.isPropertyDeclaration(node) || ts.isMethodDeclaration(node)) {
    if (node.name && ts.isPrivateIdentifier(node.name)) return '-';
  }
  if (hasModifier(node, ts.SyntaxKind.PrivateKeyword)) return '-';
  if (hasModifier(node, ts.SyntaxKind.ProtectedKeyword)) return '#';
  return '+';
}

function isSupportedMemberName(name: ts.PropertyName): boolean {
  return ts.isIdentifier(name) || ts.isPrivateIdentifier(name);
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind) : false;
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

function makeLocalNode(name: string, kind: SymbolKind, lineStart: number, lineEnd: number, isExported: boolean, extras: Partial<SymbolNode> = {}): SymbolNode {
  return { id: `${name}:${lineStart}`, name, kind, lineStart, lineEnd, isExported, nodeCategory: 'local', ...extras };
}

function makeImportNode(name: string, lineStart: number, lineEnd: number, modulePath: string, importKind: ImportKind): SymbolNode {
  return {
    id: `import:${name}:${lineStart}`,
    name,
    kind: 'variable',
    lineStart,
    lineEnd,
    isExported: false,
    nodeCategory: 'import',
    modulePath,
    importKind,
  };
}

function makeNode(name: string, kind: SymbolKind, lineStart: number, lineEnd: number, isExported: boolean, extras: Partial<SymbolNode> = {}): SymbolNode {
  return makeLocalNode(name, kind, lineStart, lineEnd, isExported, extras);
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

function clampText(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= TYPE_TEXT_LIMIT) return compact;
  return `${compact.slice(0, TYPE_TEXT_LIMIT - 1).trimEnd()}…`;
}

function formatPythonSignature(params: string, returnType?: string): string {
  const compactParams = clampText(params.trim());
  return `(${compactParams})${returnType ? `: ${returnType}` : ''}`;
}

function formatGoSignature(params: string, returnType?: string): string {
  return `(${params.trim()})${returnType ? `: ${returnType.trim()}` : ''}`;
}

function extractGoReceiverType(receiver: string): string {
  return receiver.replace(/^\s*[\w]+\s+/, '').replace(/[*\s]/g, '');
}

function isInsidePythonClass(
  indent: number,
  classes: Array<{ name: string; indent: number; startLine: number; nodeIndex: number }>,
  lineNumber: number,
  lines: string[],
): boolean {
  return classes.some((cls) => indent > cls.indent && lineNumber <= findPythonBlockEnd(lines, cls.startLine, cls.indent));
}

function extractPythonClassMembers(lines: string[], startLine: number, endLine: number, classIndent: number): SymbolMember[] {
  const members: SymbolMember[] = [];
  let insideInit = false;
  let initIndent = -1;

  for (let index = startLine; index < endLine; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = (line.match(/^\s*/)?.[0] ?? '').length;
    if (indent <= classIndent) continue;

    const method = /^\s*def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?:/.exec(line);
    if (method && indent === classIndent + 4) {
      insideInit = method[1] === '__init__';
      initIndent = indent;
      members.push({
        name: method[1],
        visibility: getPythonVisibility(method[1]),
        memberKind: 'operation',
        params: clampText(formatPythonMemberParams(method[2])),
        type: method[3] ? clampText(method[3].trim()) : undefined,
      });
      continue;
    }

    if (insideInit && indent > initIndent) {
      const attr = /^\s*self\.([A-Za-z_]\w*)\s*(?::\s*([^=]+?))?\s*=/.exec(line);
      if (attr) {
        const attributeName = attr[1];
        if (!members.some((member) => member.memberKind === 'attribute' && member.name === attributeName)) {
          members.push({
            name: attributeName,
            visibility: getPythonVisibility(attributeName),
            memberKind: 'attribute',
            type: attr[2] ? clampText(attr[2].trim()) : undefined,
          });
        }
        continue;
      }
    }

    if (insideInit && indent <= initIndent) {
      insideInit = false;
      initIndent = -1;
    }
  }

  const attributes = members.filter((member) => member.memberKind === 'attribute');
  const operations = members.filter((member) => member.memberKind === 'operation');
  return [...attributes, ...operations];
}

function getPythonVisibility(name: string): MemberVisibility {
  if (/^__.*__$/.test(name)) return '+';
  if (/^__[^_]/.test(name)) return '-';
  if (/^_[^_]/.test(name)) return '#';
  return '+';
}

function formatPythonMemberParams(params: string): string {
  return params
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== 'self' && !part.startsWith('self:'))
    .join(', ');
}

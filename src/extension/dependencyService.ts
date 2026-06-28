import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fetchFileContentAtCommit } from './gitService';

const JS_TS_ANALYZABLE_FILE_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i;
const PYTHON_ANALYZABLE_FILE_PATTERN = /\.py$/i;
const GO_ANALYZABLE_FILE_PATTERN = /\.go$/i;

export type DependencyKind = 'import' | 'require';

export interface DependencyEdge {
  from: string;
  to: string;
  kind: DependencyKind;
}

export class DependencyCruiserNotFoundError extends Error {
  constructor(analyzerPath: string) {
    super(`dependency-cruiser executable was not found at ${analyzerPath}`);
    this.name = 'DependencyCruiserNotFoundError';
  }
}

interface DependencyCruiserModule {
  source?: string;
  dependencies?: Array<{
    resolved?: string;
    module?: string;
    dependencyTypes?: string[];
  }>;
}

interface DependencyCruiserResult {
  modules?: DependencyCruiserModule[];
}

type AnalyzableGroup = 'jsTs' | 'python' | 'go';

export async function analyzeDependencies(repoPath: string, filePaths: string[], commitHash: string = ''): Promise<DependencyEdge[]> {
  const analyzableFiles = [...new Set(filePaths.filter(isAnalyzableFile))];

  if (analyzableFiles.length === 0) {
    return [];
  }

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-chronicle-'));
  const resolvedFiles = new Map<string, string>();
  const changedFileSet = new Set<string>();

  try {
    for (const filePath of analyzableFiles) {
      const normalizedRelativePath = normalizePath(filePath);
      const onDiskPath = path.resolve(repoPath, filePath);
      const tmpFilePath = path.join(tmpDir, filePath);
      let content: string | null = null;

      if (fs.existsSync(onDiskPath)) {
        content = await fs.promises.readFile(onDiskPath, 'utf8');
      } else if (commitHash) {
        content = await fetchFileContentAtCommit(repoPath, commitHash, filePath);
      }

      if (content === null) {
        continue;
      }

      await fs.promises.mkdir(path.dirname(tmpFilePath), { recursive: true });
      await fs.promises.writeFile(tmpFilePath, content, 'utf8');
      resolvedFiles.set(normalizedRelativePath, tmpFilePath);
      changedFileSet.add(normalizedRelativePath);
    }

    if (resolvedFiles.size === 0) {
      return [];
    }

    const groups = groupFilesByAnalyzer([...resolvedFiles.keys()]);
    const edges = new Map<string, DependencyEdge>();

    if (groups.jsTs.length > 0) {
      for await (const edge of analyzeWithDependencyCruiser(repoPath, tmpDir, groups.jsTs, resolvedFiles, changedFileSet)) {
        edges.set(edgeKey(edge), edge);
      }
    }

    for (const edge of analyzePythonDependencies(tmpDir, groups.python, resolvedFiles, changedFileSet)) {
      edges.set(edgeKey(edge), edge);
    }

    for (const edge of analyzeGoDependencies(tmpDir, groups.go, resolvedFiles, changedFileSet)) {
      edges.set(edgeKey(edge), edge);
    }

    return [...edges.values()];
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}

function isAnalyzableFile(filePath: string): boolean {
  return JS_TS_ANALYZABLE_FILE_PATTERN.test(filePath) || PYTHON_ANALYZABLE_FILE_PATTERN.test(filePath) || GO_ANALYZABLE_FILE_PATTERN.test(filePath);
}

function groupFilesByAnalyzer(filePaths: string[]): Record<AnalyzableGroup, string[]> {
  return filePaths.reduce<Record<AnalyzableGroup, string[]>>(
    (groups, filePath) => {
      if (JS_TS_ANALYZABLE_FILE_PATTERN.test(filePath)) {
        groups.jsTs.push(filePath);
      } else if (PYTHON_ANALYZABLE_FILE_PATTERN.test(filePath)) {
        groups.python.push(filePath);
      } else if (GO_ANALYZABLE_FILE_PATTERN.test(filePath)) {
        groups.go.push(filePath);
      }

      return groups;
    },
    { jsTs: [], python: [], go: [] },
  );
}

async function* analyzeWithDependencyCruiser(
  repoPath: string,
  tmpDir: string,
  filePaths: string[],
  resolvedFiles: Map<string, string>,
  changedFileSet: Set<string>,
): AsyncGenerator<DependencyEdge> {
  const analyzerPath = getDependencyCruiserBinPath();

  if (!fs.existsSync(analyzerPath)) {
    throw new DependencyCruiserNotFoundError(analyzerPath);
  }

  const tsConfigPath = findTsConfigPath(repoPath);
  const args = [
    analyzerPath,
    '--output-type',
    'json',
    '--no-config',
    ...(tsConfigPath ? ['--ts-config', tsConfigPath] : []),
    '--ts-pre-compilation-deps',
    ...filePaths.map((filePath) => resolvedFiles.get(filePath)).filter((filePath): filePath is string => Boolean(filePath)),
  ];

  const stdout = await runDependencyCruiser(args, repoPath);
  const result = JSON.parse(stdout) as DependencyCruiserResult;
  const seenEdges = new Set<string>();

  for (const module of result.modules ?? []) {
    const from = resolveToChangedFilePath(tmpDir, repoPath, module.source ?? '');

    if (!changedFileSet.has(from)) {
      continue;
    }

    for (const dependency of module.dependencies ?? []) {
      const to = resolveToChangedFilePath(tmpDir, repoPath, dependency.resolved ?? dependency.module ?? '');

      if (!changedFileSet.has(to)) {
        continue;
      }

      const kind: DependencyKind = dependency.dependencyTypes?.some((type) => type.toLowerCase().includes('require')) ? 'require' : 'import';
      const key = edgeKey({ from, to, kind });

      if (seenEdges.has(key)) {
        continue;
      }

      seenEdges.add(key);
      yield { from, to, kind };
    }
  }
}

function analyzePythonDependencies(
  tmpDir: string,
  filePaths: string[],
  resolvedFiles: Map<string, string>,
  changedFileSet: Set<string>,
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const seenEdges = new Set<string>();
  const changedFilesByModule = buildPythonModuleIndex([...resolvedFiles.keys()]);

  for (const from of filePaths) {
    const sourcePath = resolvedFiles.get(from);

    if (!sourcePath) {
      continue;
    }

    const content = fs.readFileSync(sourcePath, 'utf8');
    const dependencies = extractPythonImports(content);

    for (const dependency of dependencies) {
      const resolvedTargets = resolvePythonImport(from, dependency, changedFilesByModule);

      for (const target of resolvedTargets) {
        if (!changedFileSet.has(target)) {
          continue;
        }

        const edge = { from, to: target, kind: 'import' as const };
        const key = edgeKey(edge);

        if (seenEdges.has(key)) {
          continue;
        }

        seenEdges.add(key);
        edges.push(edge);
      }
    }
  }

  void tmpDir;
  return edges;
}

function analyzeGoDependencies(
  tmpDir: string,
  filePaths: string[],
  resolvedFiles: Map<string, string>,
  changedFileSet: Set<string>,
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const seenEdges = new Set<string>();
  const packageIndex = buildGoPackageIndex([...resolvedFiles.keys()]);

  for (const from of filePaths) {
    const sourcePath = resolvedFiles.get(from);

    if (!sourcePath) {
      continue;
    }

    const content = fs.readFileSync(sourcePath, 'utf8');
    const imports = extractGoImports(content);

    for (const importPath of imports) {
      for (const target of resolveGoImport(from, importPath, packageIndex)) {
        if (!changedFileSet.has(target)) {
          continue;
        }

        const edge = { from, to: target, kind: 'import' as const };
        const key = edgeKey(edge);

        if (seenEdges.has(key)) {
          continue;
        }

        seenEdges.add(key);
        edges.push(edge);
      }
    }
  }

  void tmpDir;
  return edges;
}

function extractPythonImports(content: string): string[] {
  const imports: string[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#')) {
      continue;
    }

    const importMatch = trimmed.match(/^import\s+(.+)$/);
    if (importMatch) {
      for (const part of importMatch[1].split(',')) {
        const moduleName = part.trim().split(/\s+as\s+/i)[0]?.trim();

        if (moduleName) {
          imports.push(moduleName);
        }
      }
      continue;
    }

    const fromMatch = trimmed.match(/^from\s+([.\w]+)\s+import\s+(.+)$/);
    if (fromMatch) {
      imports.push(fromMatch[1]);
    }
  }

  return imports;
}

function buildPythonModuleIndex(filePaths: string[]): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const filePath of filePaths) {
    const moduleName = pythonFilePathToModuleName(filePath);
    const candidates = index.get(moduleName) ?? [];
    candidates.push(filePath);
    index.set(moduleName, candidates);
  }

  return index;
}

function resolvePythonImport(from: string, importPath: string, moduleIndex: Map<string, string[]>): string[] {
  if (importPath.startsWith('.')) {
    const baseDirectory = path.posix.dirname(from);
    const absoluteBase = path.posix.normalize(path.posix.join(baseDirectory, importPath));
    const relativeCandidates = [
      normalizePath(`${absoluteBase}.py`),
      normalizePath(path.posix.join(absoluteBase, '__init__.py')),
    ];

    return relativeCandidates.filter((candidate) => moduleIndex.has(candidateToPythonModuleName(candidate)));
  }

  const normalizedModuleName = normalizePath(importPath.replace(/\./g, '/'));
  const candidates = new Set<string>();

  if (moduleIndex.has(normalizedModuleName)) {
    for (const target of moduleIndex.get(normalizedModuleName) ?? []) {
      candidates.add(target);
    }
  }

  const baseCandidates = [
    `${normalizedModuleName}.py`,
    path.posix.join(normalizedModuleName, '__init__.py'),
  ].map(normalizePath);

  for (const candidate of baseCandidates) {
    for (const target of moduleIndex.get(candidateToPythonModuleName(candidate)) ?? []) {
      candidates.add(target);
    }
  }

  return [...candidates];
}

function pythonFilePathToModuleName(filePath: string): string {
  if (filePath.endsWith('/__init__.py')) {
    return normalizePath(filePath.slice(0, -'/__init__.py'.length));
  }

  return normalizePath(filePath.replace(/\.py$/i, ''));
}

function candidateToPythonModuleName(candidate: string): string {
  return pythonFilePathToModuleName(candidate);
}

function buildGoPackageIndex(filePaths: string[]): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const filePath of filePaths) {
    const packageName = goFilePathToPackageName(filePath);
    const candidates = index.get(packageName) ?? [];
    candidates.push(filePath);
    index.set(packageName, candidates);
  }

  return index;
}

function resolveGoImport(from: string, importPath: string, packageIndex: Map<string, string[]>): string[] {
  const normalized = normalizePath(importPath);
  const candidates = new Set<string>();
  const baseName = path.posix.basename(from, '.go');
  const directory = path.posix.dirname(from);

  for (const target of packageIndex.get(normalized) ?? []) {
    candidates.add(target);
  }

  for (const target of packageIndex.get(path.posix.join(directory, normalized)) ?? []) {
    candidates.add(target);
  }

  for (const target of packageIndex.get(path.posix.join(directory, baseName, normalized)) ?? []) {
    candidates.add(target);
  }

  candidates.delete(from);
  return [...candidates];
}

function goFilePathToPackageName(filePath: string): string {
  const directory = path.posix.dirname(filePath);
  return directory === '.' ? path.posix.basename(filePath, '.go') : directory;
}

function extractGoImports(content: string): string[] {
  const imports: string[] = [];
  const lines = content.split(/\r?\n/);
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('//')) {
      continue;
    }

    if (inBlock) {
      if (trimmed === ')') {
        inBlock = false;
        continue;
      }

      const match = trimmed.match(/^(?:"([^"]+)"|([^\s]+)\s+"([^"]+)")$/);
      if (match) {
        imports.push(match[1] ?? match[3]);
      }
      continue;
    }

    const single = trimmed.match(/^import\s+(?:"([^"]+)"|([^\s]+)\s+"([^"]+)")$/);
    if (single) {
      imports.push(single[1] ?? single[3]);
      continue;
    }

    if (trimmed === 'import (') {
      inBlock = true;
    }
  }

  return imports;
}

function edgeKey(edge: DependencyEdge): string {
  return `${edge.from}\0${edge.to}\0${edge.kind}`;
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function resolveToChangedFilePath(tmpDir: string, repoPath: string, candidatePath: string): string {
  if (!candidatePath) {
    return candidatePath;
  }

  const absolutePath = path.isAbsolute(candidatePath) ? candidatePath : path.resolve(repoPath, candidatePath);

  if (absolutePath.startsWith(tmpDir)) {
    return normalizePath(path.relative(tmpDir, absolutePath));
  }

  if (absolutePath.startsWith(repoPath)) {
    return normalizePath(path.relative(repoPath, absolutePath));
  }

  return normalizePath(absolutePath);
}

function findTsConfigPath(repoPath: string): string | undefined {
  let currentDir = repoPath;

  while (true) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json');

    if (fs.existsSync(tsConfigPath)) {
      return tsConfigPath;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function getDependencyCruiserBinPath(): string {
  const bundledPath = path.resolve(__dirname, '..', 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruise.mjs');
  if (fs.existsSync(bundledPath)) return bundledPath;
  return path.resolve(__dirname, '..', '..', 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruise.mjs');
}

function runDependencyCruiser(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.on('error', reject);

    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf8');
      const stderr = Buffer.concat(stderrChunks).toString('utf8');

      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr || `dependency-cruiser exited with code ${code ?? 'unknown'}`));
    });
  });
}

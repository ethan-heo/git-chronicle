import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fetchFileContentAtCommit } from './gitService';
import { detectSourceLanguage, isAssetModuleFile } from './lang/fileExtensions';
import { collectModuleReferences, createTsSourceFile } from './lang/tsSourceWalker';

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

interface DependencyCruiserDependency {
  resolved?: string;
  module?: string;
  dependencyTypes?: string[];
}

interface DependencyCruiserModule {
  source?: string;
  dependencies?: DependencyCruiserDependency[];
}

interface DependencyCruiserResult {
  modules?: DependencyCruiserModule[];
}

interface TsConfigPaths {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

type AnalyzableGroup = 'jsTs' | 'python' | 'go';

export async function analyzeDependencies(repoPath: string, filePaths: string[], commitHash: string = ''): Promise<DependencyEdge[]> {
  const analyzableFiles = [...new Set(filePaths.filter(isAnalyzableFile))];

  if (analyzableFiles.length === 0) {
    return [];
  }

  // realpath resolves macOS's /var -> /private/var symlink (and similar) so tmpDir matches the
  // paths dependency-cruiser reports internally; otherwise startsWith(tmpDir) checks below always fail.
  const tmpDir = await fs.promises.realpath(await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-chronicle-')));
  const resolvedFiles = new Map<string, string>();
  const changedFileSet = new Set<string>();
  const tsConfigPath = findTsConfigPath(repoPath);
  const tsConfigPaths = readTsConfigPaths(tsConfigPath);

  try {
    for (const filePath of analyzableFiles) {
      const normalizedRelativePath = normalizePath(filePath);
      const tmpFilePath = path.join(tmpDir, filePath);
      let content: string | null = null;

      if (commitHash) {
        // Always resolve from the commit snapshot so files that survived to HEAD don't get
        // analyzed against a later refactor while files removed since the commit are analyzed
        // at the commit's own state — a mismatch that silently drops real dependency edges.
        content = await fetchFileContentAtCommit(repoPath, commitHash, filePath);
      } else {
        const onDiskPath = path.resolve(repoPath, filePath);

        if (fs.existsSync(onDiskPath)) {
          content = await fs.promises.readFile(onDiskPath, 'utf8');
        }
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

      for (const edge of analyzeJsTsDependenciesFromSource(tmpDir, repoPath, groups.jsTs, resolvedFiles, changedFileSet, tsConfigPaths)) {
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
  // Asset modules (CSS Modules/JSON/SVG) are never parsed for their own outgoing imports
  // (groupFilesByAnalyzer only groups jsTs/python/go), but they must still be copied into
  // resolvedFiles/changedFileSet so JS/TS imports pointing at them can resolve to a valid edge target.
  return detectSourceLanguage(filePath) !== null || isAssetModuleFile(filePath);
}

function groupFilesByAnalyzer(filePaths: string[]): Record<AnalyzableGroup, string[]> {
  return filePaths.reduce<Record<AnalyzableGroup, string[]>>(
    (groups, filePath) => {
      const language = detectSourceLanguage(filePath);

      if (language) {
        groups[language].push(filePath);
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
  const tsConfigPaths = readTsConfigPaths(tsConfigPath);
  const payload = {
    files: filePaths.map((filePath) => resolvedFiles.get(filePath)).filter((filePath): filePath is string => Boolean(filePath)),
    options: {
      outputType: 'json',
      tsPreCompilationDeps: true,
      baseDir: repoPath,
      ...(tsConfigPath ? { tsConfig: { fileName: tsConfigPath } } : {}),
    },
  };

  const stdout = await runDependencyCruiser(analyzerPath, payload, repoPath);
  const result = JSON.parse(stdout) as DependencyCruiserResult;
  const seenEdges = new Set<string>();

  for (const module of result.modules ?? []) {
    const from = resolveToChangedFilePath(tmpDir, repoPath, module.source ?? '');

    if (!changedFileSet.has(from)) {
      continue;
    }

    for (const dependency of module.dependencies ?? []) {
      const to = resolveDependencyTargetPath(tmpDir, repoPath, from, dependency, tsConfigPaths);

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

function analyzeJsTsDependenciesFromSource(
  tmpDir: string,
  repoPath: string,
  filePaths: string[],
  resolvedFiles: Map<string, string>,
  changedFileSet: Set<string>,
  tsConfigPaths: TsConfigPaths | undefined,
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const seenEdges = new Set<string>();
  const changedFilePaths = [...changedFileSet];

  for (const from of filePaths) {
    const sourcePath = resolvedFiles.get(from);

    if (!sourcePath) {
      continue;
    }

    const content = fs.readFileSync(sourcePath, 'utf8');
    const sourceFile = createTsSourceFile(from, content);
    const dependencies = collectModuleReferences(sourceFile).map((reference) => reference.specifier);

    for (const dependency of dependencies) {
      const to = resolveJsTsDependencyTarget(from, dependency, changedFilePaths, tmpDir, repoPath, tsConfigPaths);

      if (!to) {
        continue;
      }

      const edge: DependencyEdge = { from, to, kind: 'import' };
      const key = edgeKey(edge);

      if (seenEdges.has(key)) {
        continue;
      }

      seenEdges.add(key);
      edges.push(edge);
    }
  }

  return edges;
}

function resolveJsTsDependencyTarget(
  fromPath: string,
  dependency: string,
  changedFilePaths: string[],
  tmpDir: string,
  repoPath: string,
  tsConfigPaths: TsConfigPaths | undefined,
): string | null {
  const candidates = new Set<string>();
  const isRelativeDependency = dependency.startsWith('.');
  const normalizedDependency = normalizePath(dependency);

  candidates.add(normalizedDependency);

  if (isRelativeDependency) {
    const sourceDirectory = path.posix.dirname(normalizePath(fromPath));
    candidates.add(normalizePath(path.posix.join(sourceDirectory, normalizedDependency)));
  } else {
    const aliasResolution = resolveTsConfigAlias(repoPath, tmpDir, normalizedDependency, tsConfigPaths);
    if (aliasResolution) {
      candidates.add(resolveToChangedFilePath(tmpDir, repoPath, aliasResolution));
    }
  }

  for (const candidate of [...candidates]) {
    const resolvedCandidate = resolveToChangedFilePath(tmpDir, repoPath, candidate);
    if (changedFilePaths.includes(resolvedCandidate)) {
      return resolvedCandidate;
    }

    const withExtension = resolveExistingSourceFile(candidate, tmpDir, repoPath);
    if (withExtension) {
      const normalized = resolveToChangedFilePath(tmpDir, repoPath, withExtension);
      if (changedFilePaths.includes(normalized)) {
        return normalized;
      }
    }
  }

  return null;
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

function resolveDependencyTargetPath(
  tmpDir: string,
  repoPath: string,
  fromPath: string,
  dependency: DependencyCruiserDependency,
  tsConfigPaths: TsConfigPaths | undefined,
): string {
  if (dependency.resolved) {
    // dependency-cruiser already resolved this to a filesystem path relative to baseDir (repoPath) or
    // absolute. Resolve it directly — rejoining it against the importing file's directory (as done below
    // for raw specifiers) double-applies path segments and silently breaks nested-directory imports.
    return resolveToChangedFilePath(tmpDir, repoPath, normalizePath(dependency.resolved));
  }

  const normalizedCandidate = normalizePath(dependency.module ?? '');
  const directResolution = resolveChangedFileCandidate(tmpDir, repoPath, fromPath, normalizedCandidate);

  if (path.isAbsolute(normalizedCandidate) || normalizedCandidate.startsWith('.') || normalizedCandidate.startsWith('/')) {
    return directResolution;
  }

  const aliasResolution = resolveTsConfigAlias(repoPath, tmpDir, normalizedCandidate, tsConfigPaths);

  if (aliasResolution) {
    return resolveToChangedFilePath(tmpDir, repoPath, aliasResolution);
  }

  return directResolution;
}

function resolveChangedFileCandidate(tmpDir: string, repoPath: string, fromPath: string, candidatePath: string): string {
  const sourceDirectory = path.posix.dirname(normalizePath(fromPath));
  const relativeCandidate = candidatePath.startsWith('.') ? normalizePath(path.posix.join(sourceDirectory, candidatePath)) : candidatePath;
  const resolvedCandidate = resolveExistingSourceFile(relativeCandidate, tmpDir, repoPath) ?? relativeCandidate;

  return resolveToChangedFilePath(tmpDir, repoPath, resolvedCandidate);
}

function resolveTsConfigAlias(
  repoPath: string,
  tmpDir: string,
  specifier: string,
  tsConfigPaths: TsConfigPaths | undefined,
): string | null {
  const compilerOptions = tsConfigPaths?.compilerOptions;
  const baseUrl = compilerOptions?.baseUrl ?? '.';
  const paths = compilerOptions?.paths ?? {};
  const baseDir = repoPath;
  const baseUrlDir = path.resolve(baseDir, baseUrl);

  for (const [pattern, replacements] of Object.entries(paths)) {
    const match = matchTsConfigPathPattern(pattern, specifier);

    if (!match) {
      continue;
    }

    for (const replacement of replacements) {
      const substituted = substituteTsConfigPath(replacement, match);
      const candidate = path.resolve(baseUrlDir, substituted);

      const resolved = resolveExistingSourceFile(candidate, tmpDir, repoPath);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
}

function matchTsConfigPathPattern(pattern: string, specifier: string): string[] | null {
  if (!pattern.includes('*')) {
    return pattern === specifier ? [] : null;
  }

  const [prefix, suffix] = pattern.split('*');
  if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix ?? '')) {
    return null;
  }

  return [specifier.slice(prefix.length, specifier.length - (suffix?.length ?? 0))];
}

function substituteTsConfigPath(replacement: string, matches: string[]): string {
  let result = replacement;

  for (const match of matches) {
    result = result.replace('*', match);
  }

  return result;
}

function resolveExistingSourceFile(candidate: string, tmpDir: string, repoPath: string): string | null {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
  const hasExtension = path.extname(candidate) !== '';
  const candidates = hasExtension
    ? [candidate]
    : [candidate, ...extensions.map((extension) => `${candidate}${extension}`), ...extensions.map((extension) => path.join(candidate, `index${extension}`))];

  for (const filePath of candidates) {
    const tmpCandidate = path.isAbsolute(filePath) ? filePath : path.join(tmpDir, filePath);
    if (fs.existsSync(tmpCandidate)) {
      return tmpCandidate;
    }

    const repoCandidate = path.isAbsolute(filePath) ? filePath : path.resolve(repoPath, filePath);
    if (fs.existsSync(repoCandidate)) {
      return repoCandidate;
    }
  }

  const directory = path.dirname(candidate);
  const baseName = path.basename(candidate);
  const searchRoots = [path.join(tmpDir, directory), path.resolve(repoPath, directory)];

  for (const root of searchRoots) {
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
      continue;
    }

    for (const entry of fs.readdirSync(root)) {
      if (path.basename(entry, path.extname(entry)) === baseName) {
        return path.join(root, entry);
      }
    }
  }

  return null;
}

function findTsConfigPath(repoPath: string): string | undefined {
  let currentDir = repoPath;

  while (currentDir) {
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

  return undefined;
}

function readTsConfigPaths(tsConfigPath: string | undefined): TsConfigPaths | undefined {
  if (!tsConfigPath || !fs.existsSync(tsConfigPath)) {
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(tsConfigPath, 'utf8')) as TsConfigPaths;
  } catch {
    return undefined;
  }
}

function getDependencyCruiserBinPath(): string {
  const candidatePaths = [
    path.resolve(__dirname, '..', 'depcruiser-runner.mjs'),
    path.resolve(__dirname, '..', '..', 'dist', 'depcruiser-runner.mjs'),
    path.resolve(__dirname, '..', '..', 'src', 'extension', 'depcruiser-runner.mjs'),
    path.resolve(__dirname, '..', '..', 'depcruiser-runner.mjs'),
  ];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return candidatePaths[0];
}

const DEPENDENCY_CRUISER_TIMEOUT_MS = 30_000;

function runDependencyCruiser(scriptPath: string, payload: unknown, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // process.execPath is the VSCode/Electron binary inside the extension host; without this,
        // the child launches as Electron (GUI init) instead of plain Node and can hang indefinitely.
        ELECTRON_RUN_AS_NODE: '1',
        // Strips any inherited --inspect flag from the debugged extension host so the child doesn't
        // try to bind the same debug port and hang waiting for a debugger to attach.
        NODE_OPTIONS: '',
      },
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill();
      reject(new Error(`dependency-cruiser timed out after ${DEPENDENCY_CRUISER_TIMEOUT_MS / 1000}s`));
    }, DEPENDENCY_CRUISER_TIMEOUT_MS);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.on('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      reject(error);
    });

    child.stdin?.end(`${JSON.stringify(payload)}\n`);

    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);

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

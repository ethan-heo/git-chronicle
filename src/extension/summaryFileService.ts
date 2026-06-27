import * as fs from 'fs';
import * as path from 'path';

export interface SummaryFileResult {
  content: string;
  savedPath: string;
}

export class SummarySaveError extends Error {
  constructor(
    message = '저장 경로를 생성할 수 없습니다. 권한을 확인하세요',
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SummarySaveError';
  }
}

export function getSummaryFilePath(savePath: string, commitHash: string, filePath: string): string {
  return path.join(savePath, commitHash, `${toSummaryFileName(filePath)}.md`);
}

export function getCommitSummaryFilePath(savePath: string, commitHash: string): string {
  return path.join(savePath, commitHash, '_commit_summary.md');
}

export function loadSummary(savePath: string, commitHash: string, filePath: string): SummaryFileResult | null {
  const savedPath = getSummaryFilePath(savePath, commitHash, filePath);

  if (!fs.existsSync(savedPath)) {
    return null;
  }

  return {
    content: fs.readFileSync(savedPath, 'utf8'),
    savedPath,
  };
}

export function saveSummary(savePath: string, commitHash: string, filePath: string, content: string): string {
  const savedPath = getSummaryFilePath(savePath, commitHash, filePath);
  writeSummaryFile(savedPath, content);
  return savedPath;
}

export function loadCommitSummary(savePath: string, commitHash: string): SummaryFileResult | null {
  const savedPath = getCommitSummaryFilePath(savePath, commitHash);

  if (!fs.existsSync(savedPath)) {
    return null;
  }

  return {
    content: fs.readFileSync(savedPath, 'utf8'),
    savedPath,
  };
}

export function saveCommitSummary(savePath: string, commitHash: string, content: string): string {
  const savedPath = getCommitSummaryFilePath(savePath, commitHash);
  writeSummaryFile(savedPath, content);
  return savedPath;
}

export function hasSavedSummary(savePath: string | null, commitHash: string, filePath: string): boolean {
  if (!savePath) {
    return false;
  }

  return fs.existsSync(getSummaryFilePath(savePath, commitHash, filePath));
}

function toSummaryFileName(filePath: string): string {
  return filePath.replace(/[\\/]/g, '__');
}

function writeSummaryFile(savedPath: string, content: string): void {
  try {
    fs.mkdirSync(path.dirname(savedPath), { recursive: true });
    fs.writeFileSync(savedPath, content, 'utf8');
  } catch (error) {
    throw new SummarySaveError(undefined, error);
  }
}

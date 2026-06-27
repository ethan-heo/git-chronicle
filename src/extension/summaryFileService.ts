import * as fs from 'fs';
import * as path from 'path';

export interface SummaryFileResult {
  content: string;
  savedPath: string;
}

export function getSummaryFilePath(savePath: string, commitHash: string, filePath: string): string {
  return path.join(savePath, commitHash, `${toSummaryFileName(filePath)}.md`);
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
  fs.mkdirSync(path.dirname(savedPath), { recursive: true });
  fs.writeFileSync(savedPath, content, 'utf8');
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

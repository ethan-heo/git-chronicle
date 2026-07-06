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

const COMMIT_SUMMARY_FILENAME = '전체_파일_정리.md';
const COMMIT_SUMMARY_FILENAME_LEGACY = '_commit_summary.md';
const COMMIT_NOTE_FILENAME = '노트.md';

export function toCommitDirName(shortHash: string, commitMessage: string): string {
  const sanitized = commitMessage
    .replace(/[^A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${shortHash}_${sanitized || 'commit'}`;
}

export function getSummaryFilePath(savePath: string, commitHash: string, filePath: string, commitMessage?: string): string {
  return path.join(savePath, getCommitDirName(commitHash, commitMessage), `${toSummaryFileName(filePath)}.md`);
}

export function getCommitSummaryFilePath(savePath: string, commitHash: string, commitMessage?: string): string {
  return path.join(savePath, getCommitDirName(commitHash, commitMessage), commitMessage ? COMMIT_SUMMARY_FILENAME : COMMIT_SUMMARY_FILENAME_LEGACY);
}

export function getCommitNoteFilePath(savePath: string, commitHash: string, commitMessage?: string): string {
  return path.join(savePath, getCommitDirName(commitHash, commitMessage), COMMIT_NOTE_FILENAME);
}

export function loadSummary(savePath: string, commitHash: string, filePath: string, commitMessage?: string): SummaryFileResult | null {
  const savedPath = findExistingPath(getSummaryFilePathCandidates(savePath, commitHash, filePath, commitMessage));

  if (!savedPath) {
    return null;
  }

  return {
    content: fs.readFileSync(savedPath, 'utf8'),
    savedPath,
  };
}

export function saveSummary(savePath: string, commitHash: string, filePath: string, content: string, commitMessage?: string): string {
  const savedPath = getSummaryFilePath(savePath, commitHash, filePath, commitMessage);
  writeSummaryFile(savedPath, content);
  return savedPath;
}

export function loadCommitSummary(savePath: string, commitHash: string, commitMessage?: string): SummaryFileResult | null {
  const savedPath = findExistingPath(getCommitSummaryFilePathCandidates(savePath, commitHash, commitMessage));

  if (!savedPath) {
    return null;
  }

  return {
    content: fs.readFileSync(savedPath, 'utf8'),
    savedPath,
  };
}

export function saveCommitSummary(savePath: string, commitHash: string, content: string, commitMessage?: string): string {
  const savedPath = getCommitSummaryFilePath(savePath, commitHash, commitMessage);
  writeSummaryFile(savedPath, content);
  return savedPath;
}

export function loadNote(savePath: string, commitHash: string, commitMessage?: string): SummaryFileResult | null {
  const savedPath = getCommitNoteFilePath(savePath, commitHash, commitMessage);

  if (!fs.existsSync(savedPath)) {
    return null;
  }

  return {
    content: fs.readFileSync(savedPath, 'utf8'),
    savedPath,
  };
}

export function saveNote(savePath: string, commitHash: string, content: string, commitMessage?: string): string {
  const savedPath = getCommitNoteFilePath(savePath, commitHash, commitMessage);
  writeSummaryFile(savedPath, content);
  return savedPath;
}

export function appendSummaryQA(savedPath: string, question: string, answer: string): string {
  const existingContent = fs.readFileSync(savedPath, 'utf8');
  const separator = existingContent.endsWith('\n') ? '' : '\n';
  const hasQABlock = /\n---\n\s*\n(?:## Q&A\s*\n\s*\n)?### Q\./m.test(existingContent);
  const appendedContent = hasQABlock
    ? `${separator}\n\n### Q. ${question}\n\n${answer}\n`
    : `${separator}\n---\n\n### Q. ${question}\n\n${answer}\n`;

  writeSummaryFile(savedPath, `${existingContent}${appendedContent}`);
  return appendedContent;
}

export function hasSavedSummary(savePath: string | null, commitHash: string, filePath: string, commitMessage?: string): boolean {
  if (!savePath) {
    return false;
  }

  return Boolean(findExistingPath(getSummaryFilePathCandidates(savePath, commitHash, filePath, commitMessage)));
}

function toSummaryFileName(filePath: string): string {
  return filePath.replace(/[\\/]/g, '__');
}

function getCommitDirName(commitHash: string, commitMessage?: string): string {
  if (!commitMessage) {
    return commitHash;
  }

  return toCommitDirName(commitHash.slice(0, 7), commitMessage);
}

function getSummaryFilePathCandidates(savePath: string, commitHash: string, filePath: string, commitMessage?: string): string[] {
  return [getSummaryFilePath(savePath, commitHash, filePath, commitMessage), getSummaryFilePath(savePath, commitHash, filePath)];
}

function getCommitSummaryFilePathCandidates(savePath: string, commitHash: string, commitMessage?: string): string[] {
  if (!commitMessage) {
    return [getCommitSummaryFilePath(savePath, commitHash)];
  }

  const nextDir = getCommitDirName(commitHash, commitMessage);

  return [
    path.join(savePath, nextDir, COMMIT_SUMMARY_FILENAME),
    path.join(savePath, nextDir, COMMIT_SUMMARY_FILENAME_LEGACY),
    getCommitSummaryFilePath(savePath, commitHash),
  ];
}

function findExistingPath(candidates: string[]): string | null {
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function writeSummaryFile(savedPath: string, content: string): void {
  try {
    fs.mkdirSync(path.dirname(savedPath), { recursive: true });
    fs.writeFileSync(savedPath, content, 'utf8');
  } catch (error) {
    throw new SummarySaveError(undefined, error);
  }
}

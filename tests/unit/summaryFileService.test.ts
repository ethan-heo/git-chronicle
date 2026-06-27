import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getCommitSummaryFilePath,
  getSummaryFilePath,
  saveCommitSummary,
  saveSummary,
  SummarySaveError,
} from '../../src/extension/summaryFileService';

const tempPaths: string[] = [];

afterEach(() => {
  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
});

describe('summaryFileService', () => {
  it('파일 단위 AI 정리는 커밋 해시 폴더 아래 파일 경로 기반 md로 저장한다', () => {
    expect(getSummaryFilePath('/tmp/gae', 'abc123', 'src/App.tsx')).toBe(path.join('/tmp/gae', 'abc123', 'src__App.tsx.md'));
  });

  it('커밋 단위 AI 정리는 커밋 해시 폴더 아래 _commit_summary.md로 저장한다', () => {
    expect(getCommitSummaryFilePath('/tmp/gae', 'abc123')).toBe(path.join('/tmp/gae', 'abc123', '_commit_summary.md'));
  });

  it('저장 디렉토리가 없으면 자동 생성한다', () => {
    const rootPath = makeTempPath();
    const savedPath = saveSummary(rootPath, 'abc123', 'src/App.tsx', '# Summary');

    expect(savedPath).toBe(path.join(rootPath, 'abc123', 'src__App.tsx.md'));
    expect(fs.readFileSync(savedPath, 'utf8')).toBe('# Summary');
  });

  it('저장 경로를 생성할 수 없으면 전용 에러를 던진다', () => {
    const rootPath = makeTempPath();
    const fileSavePath = path.join(rootPath, 'not-a-directory');
    fs.writeFileSync(fileSavePath, 'occupied', 'utf8');

    expect(() => saveCommitSummary(fileSavePath, 'abc123', '# Commit Summary')).toThrow(SummarySaveError);
    expect(() => saveCommitSummary(fileSavePath, 'abc123', '# Commit Summary')).toThrow('저장 경로를 생성할 수 없습니다. 권한을 확인하세요');
  });
});

function makeTempPath(): string {
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gae-summary-'));
  tempPaths.push(tempPath);
  return tempPath;
}

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getCommitSummaryFilePath,
  getSummaryFilePath,
  hasSavedSummary,
  loadCommitSummary,
  loadSummary,
  saveCommitSummary,
  saveSummary,
  SummarySaveError,
  toCommitDirName,
} from '../../src/extension/summaryFileService';

const tempPaths: string[] = [];

afterEach(() => {
  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
});

describe('summaryFileService', () => {
  it('커밋 메시지를 읽기 쉬운 디렉토리 이름으로 정리한다', () => {
    expect(toCommitDirName('abc1234', 'feat: add batch AI summary')).toBe('abc1234_feat-add-batch-AI-summary');
    expect(toCommitDirName('abc1234', 'fix/auth: login 버그 수정')).toBe('abc1234_fixauth-login-버그-수정');
    expect(toCommitDirName('abc1234', 'chore: update deps & config')).toBe('abc1234_chore-update-deps-config');
    expect(toCommitDirName('abc1234', ' / : * ? " < > | ')).toBe('abc1234_commit');
    expect(toCommitDirName('abc1234', 'x'.repeat(80))).toBe(`abc1234_${'x'.repeat(60)}`);
  });

  it('파일 단위 AI 정리는 단축 해시와 커밋 메시지 폴더 아래 파일 경로 기반 md로 저장한다', () => {
    expect(getSummaryFilePath('/tmp/gae', 'abc123456789', 'src/App.tsx', 'feat: add batch AI summary')).toBe(
      path.join('/tmp/gae', 'abc1234_feat-add-batch-AI-summary', 'src__App.tsx.md'),
    );
  });

  it('커밋 단위 AI 정리는 한글 파일명으로 저장한다', () => {
    expect(getCommitSummaryFilePath('/tmp/gae', 'abc123456789', 'feat: add batch AI summary')).toBe(
      path.join('/tmp/gae', 'abc1234_feat-add-batch-AI-summary', '전체_파일_정리.md'),
    );
  });

  it('커밋 메시지가 없으면 기존 커밋 해시 폴더와 _commit_summary.md를 유지한다', () => {
    expect(getSummaryFilePath('/tmp/gae', 'abc123', 'src/App.tsx')).toBe(path.join('/tmp/gae', 'abc123', 'src__App.tsx.md'));
    expect(getCommitSummaryFilePath('/tmp/gae', 'abc123')).toBe(path.join('/tmp/gae', 'abc123', '_commit_summary.md'));
  });

  it('저장 디렉토리가 없으면 자동 생성한다', () => {
    const rootPath = makeTempPath();
    const savedPath = saveSummary(rootPath, 'abc123456789', 'src/App.tsx', '# Summary', 'feat: add batch AI summary');

    expect(savedPath).toBe(path.join(rootPath, 'abc1234_feat-add-batch-AI-summary', 'src__App.tsx.md'));
    expect(fs.readFileSync(savedPath, 'utf8')).toBe('# Summary');
  });

  it('파일 단위 AI 정리는 신규 경로를 우선 읽고 구 경로로 폴백한다', () => {
    const rootPath = makeTempPath();
    const legacyPath = saveSummary(rootPath, 'abc123456789', 'src/App.tsx', '# Legacy');

    expect(loadSummary(rootPath, 'abc123456789', 'src/App.tsx', 'feat: add batch AI summary')).toEqual({
      content: '# Legacy',
      savedPath: legacyPath,
    });

    const nextPath = saveSummary(rootPath, 'abc123456789', 'src/App.tsx', '# Next', 'feat: add batch AI summary');

    expect(loadSummary(rootPath, 'abc123456789', 'src/App.tsx', 'feat: add batch AI summary')).toEqual({
      content: '# Next',
      savedPath: nextPath,
    });
    expect(hasSavedSummary(rootPath, 'abc123456789', 'src/App.tsx', 'feat: add batch AI summary')).toBe(true);
  });

  it('커밋 단위 AI 정리는 신규 파일명, 신규 폴더의 구 파일명, 구 경로 순서로 폴백한다', () => {
    const rootPath = makeTempPath();
    const legacyPath = saveCommitSummary(rootPath, 'abc123456789', '# Legacy');

    expect(loadCommitSummary(rootPath, 'abc123456789', 'feat: add batch AI summary')).toEqual({
      content: '# Legacy',
      savedPath: legacyPath,
    });

    const nextDirLegacyPath = path.join(rootPath, 'abc1234_feat-add-batch-AI-summary', '_commit_summary.md');
    fs.mkdirSync(path.dirname(nextDirLegacyPath), { recursive: true });
    fs.writeFileSync(nextDirLegacyPath, '# Next Dir Legacy', 'utf8');

    expect(loadCommitSummary(rootPath, 'abc123456789', 'feat: add batch AI summary')).toEqual({
      content: '# Next Dir Legacy',
      savedPath: nextDirLegacyPath,
    });

    const nextPath = saveCommitSummary(rootPath, 'abc123456789', '# Next', 'feat: add batch AI summary');

    expect(loadCommitSummary(rootPath, 'abc123456789', 'feat: add batch AI summary')).toEqual({
      content: '# Next',
      savedPath: nextPath,
    });
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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  appendSummaryQA,
  getCommitNoteFilePath,
  getCommitSummaryFilePath,
  getSummaryFilePath,
  hasSavedSummary,
  loadCommitSummary,
  loadNote,
  loadSummary,
  saveCommitSummary,
  saveNote,
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

  it('언어가 en이면 커밋/노트 단위 저장 파일명을 영문으로 사용한다', () => {
    expect(getCommitSummaryFilePath('/tmp/gae', 'abc123456789', 'feat: add batch AI summary', 'en')).toBe(
      path.join('/tmp/gae', 'abc1234_feat-add-batch-AI-summary', 'full_file_summary.md'),
    );
    expect(getCommitNoteFilePath('/tmp/gae', 'abc123456789', 'feat: add batch AI summary', 'en')).toBe(
      path.join('/tmp/gae', 'abc1234_feat-add-batch-AI-summary', 'note.md'),
    );
    expect(getCommitNoteFilePath('/tmp/gae', 'abc123456789', 'feat: add batch AI summary')).toBe(
      path.join('/tmp/gae', 'abc1234_feat-add-batch-AI-summary', '노트.md'),
    );
  });

  it('영문 설정으로 저장한 커밋 정리도 언어 지정 없이 불러올 수 있다', () => {
    const rootPath = makeTempPath();
    const savedPath = saveCommitSummary(rootPath, 'abc123456789', '# Summary', 'feat: add batch AI summary', 'en');

    expect(savedPath).toBe(path.join(rootPath, 'abc1234_feat-add-batch-AI-summary', 'full_file_summary.md'));
    expect(loadCommitSummary(rootPath, 'abc123456789', 'feat: add batch AI summary')).toEqual({
      content: '# Summary',
      savedPath,
    });
  });

  it('노트도 언어별 파일명으로 저장하고, 언어 지정 없이 양쪽 파일명을 모두 찾는다', () => {
    const rootPath = makeTempPath();
    const koPath = saveNote(rootPath, 'abc123456789', '# 메모', 'feat: add batch AI summary');

    expect(koPath).toBe(path.join(rootPath, 'abc1234_feat-add-batch-AI-summary', '노트.md'));
    expect(loadNote(rootPath, 'abc123456789', 'feat: add batch AI summary')).toEqual({
      content: '# 메모',
      savedPath: koPath,
    });

    fs.rmSync(koPath);
    const enPath = saveNote(rootPath, 'abc123456789', '# Note', 'feat: add batch AI summary', 'en');

    expect(enPath).toBe(path.join(rootPath, 'abc1234_feat-add-batch-AI-summary', 'note.md'));
    expect(loadNote(rootPath, 'abc123456789', 'feat: add batch AI summary')).toEqual({
      content: '# Note',
      savedPath: enPath,
    });
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

  it('첫 번째 질문 답변 추가 시 Q&A 헤더 없이 질문 블록만 저장한다', () => {
    const rootPath = makeTempPath();
    const savedPath = saveCommitSummary(rootPath, 'abc123456789', '# Summary', 'feat: add batch AI summary');

    const appendedContent = appendSummaryQA(savedPath, '무엇이 바뀌었나요?', '핵심 로직이 단순화되었습니다.');

    expect(appendedContent).toBe('\n\n---\n\n### Q. 무엇이 바뀌었나요?\n\n핵심 로직이 단순화되었습니다.\n');
    expect(fs.readFileSync(savedPath, 'utf8')).toBe('# Summary\n\n---\n\n### Q. 무엇이 바뀌었나요?\n\n핵심 로직이 단순화되었습니다.\n');
  });

  it('기존 질문 블록이 있으면 헤더 없이 다음 질문만 이어서 추가한다', () => {
    const rootPath = makeTempPath();
    const savedPath = saveCommitSummary(
      rootPath,
      'abc123456789',
      '# Summary\n---\n\n### Q. 첫 질문?\n\n첫 답변\n',
      'feat: add batch AI summary',
    );

    const appendedContent = appendSummaryQA(savedPath, '두 번째 질문?', '두 번째 답변');

    expect(appendedContent).toBe('\n\n### Q. 두 번째 질문?\n\n두 번째 답변\n');
    expect(fs.readFileSync(savedPath, 'utf8')).toBe('# Summary\n---\n\n### Q. 첫 질문?\n\n첫 답변\n\n\n### Q. 두 번째 질문?\n\n두 번째 답변\n');
  });

  it('기존 Q&A 헤더 형식 저장본에도 다음 질문을 자연스럽게 이어서 추가한다', () => {
    const rootPath = makeTempPath();
    const savedPath = saveCommitSummary(
      rootPath,
      'abc123456789',
      '# Summary\n---\n\n## Q&A\n\n### Q. 첫 질문?\n\n첫 답변\n',
      'feat: add batch AI summary',
    );

    const appendedContent = appendSummaryQA(savedPath, '두 번째 질문?', '두 번째 답변');

    expect(appendedContent).toBe('\n\n### Q. 두 번째 질문?\n\n두 번째 답변\n');
    expect(fs.readFileSync(savedPath, 'utf8')).toContain('## Q&A\n\n### Q. 첫 질문?\n\n첫 답변\n\n\n### Q. 두 번째 질문?\n\n두 번째 답변\n');
  });
});

function makeTempPath(): string {
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gae-summary-'));
  tempPaths.push(tempPath);
  return tempPath;
}

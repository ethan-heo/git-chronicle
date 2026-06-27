import * as vscode from 'vscode';
import { streamAISummary } from './aiService';
import type { AIProviderName } from './aiTypes';
import { analyzeDependencies, DependencyCruiserNotFoundError } from './dependencyService';
import { fetchChangedFiles, fetchCommitFullDiff, fetchCommits, fetchFileDiff, GitRepositoryNotFoundError } from './gitService';
import { buildCommitSummaryPrompt, buildFileSummaryPrompt } from './prompts';
import { loadCommitSummary, loadSummary, saveCommitSummary, saveSummary } from './summaryFileService';

interface WebviewMessage {
  type: string;
  payload?: FetchCommitsPayload | FetchChangedFilesPayload | FetchFileDiffPayload | AnalyzeDependenciesPayload | StartAISummaryFilePayload | StartAISummaryCommitPayload;
}

interface FetchCommitsPayload {
  page?: number;
  pageSize?: number;
  filterDateStart?: string | null;
  filterDateEnd?: string | null;
  filterAuthor?: string | null;
  filterKeyword?: string;
}

interface FetchChangedFilesPayload {
  commitHash?: string;
  savePath?: string | null;
}

interface FetchFileDiffPayload {
  commitHash?: string;
  filePath?: string;
}

interface AnalyzeDependenciesPayload {
  filePaths?: string[];
}

interface StartAISummaryFilePayload {
  commitHash?: string;
  filePath?: string;
  provider?: AIProviderName | null;
  savePath?: string | null;
  forceRegenerate?: boolean;
}

interface StartAISummaryCommitPayload {
  commitHash?: string;
  provider?: AIProviderName | null;
  savePath?: string | null;
  forceRegenerate?: boolean;
}

const FILE_TOKEN_LIMIT_CHARS = 12_000;
const COMMIT_TOKEN_LIMIT_CHARS = 20_000;

export function registerMessageHandler(panel: vscode.WebviewPanel): void {
  panel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
    switch (message.type) {
      case 'PING':
        await panel.webview.postMessage({
          type: 'PONG',
          payload: {
            message: 'Extension Host 연결이 준비되었습니다.',
          },
        });
        break;
      case 'FETCH_COMMITS':
        await handleFetchCommits(panel, message.payload as FetchCommitsPayload);
        break;
      case 'FETCH_CHANGED_FILES':
        await handleFetchChangedFiles(panel, message.payload as FetchChangedFilesPayload);
        break;
      case 'FETCH_FILE_DIFF':
        await handleFetchFileDiff(panel, message.payload as FetchFileDiffPayload);
        break;
      case 'ANALYZE_DEPENDENCIES':
        await handleAnalyzeDependencies(panel, message.payload as AnalyzeDependenciesPayload);
        break;
      case 'FETCH_AI_SUMMARY_SETTINGS':
        await handleFetchAISummarySettings(panel);
        break;
      case 'START_AI_SUMMARY_FILE':
        await handleStartAISummaryFile(panel, message.payload as StartAISummaryFilePayload);
        break;
      case 'START_AI_SUMMARY_COMMIT':
        await handleStartAISummaryCommit(panel, message.payload as StartAISummaryCommitPayload);
        break;
      case 'OPEN_REPOSITORY':
        await vscode.commands.executeCommand('vscode.openFolder');
        break;
      default:
        await panel.webview.postMessage({
          type: 'UNKNOWN_MESSAGE',
          payload: {
            message: `지원하지 않는 메시지입니다: ${message.type}`,
          },
        });
    }
  });
}

async function handleFetchAISummarySettings(panel: vscode.WebviewPanel): Promise<void> {
  const configuration = vscode.workspace.getConfiguration('gitAuthorExplorer');

  await panel.webview.postMessage({
    type: 'AI_SUMMARY_SETTINGS_LOADED',
    payload: {
      savePath: configuration.get<string>('savePath') || null,
      activeAIProvider: configuration.get<AIProviderName>('activeAIProvider') || null,
    },
  });
}

async function handleAnalyzeDependencies(panel: vscode.WebviewPanel, payload: AnalyzeDependenciesPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOAD_FAILED',
      payload: {
        message: 'Git 저장소가 감지되지 않았습니다',
      },
    });
    return;
  }

  try {
    const edges = await analyzeDependencies(repoPath, payload.filePaths ?? []);

    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOADED',
      payload: {
        edges,
      },
    });
  } catch (error) {
    const message =
      error instanceof DependencyCruiserNotFoundError
        ? 'dependency-cruiser가 설치되지 않았습니다. pnpm install 후 다시 시도해주세요.'
        : error instanceof Error
          ? error.message
          : '의존 관계를 분석하지 못했습니다';

    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOAD_FAILED',
      payload: {
        message,
      },
    });
  }
}

async function handleFetchCommits(panel: vscode.WebviewPanel, payload: FetchCommitsPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'GIT_REPOSITORY_NOT_FOUND',
      payload: {
        message: 'Git 저장소가 감지되지 않았습니다',
      },
    });
    return;
  }

  try {
    const page = payload.page ?? 0;
    const pageSize = payload.pageSize ?? 200;
    const commits = await fetchCommits({
      repoPath,
      page,
      pageSize,
      dateStart: payload.filterDateStart,
      dateEnd: payload.filterDateEnd,
      author: payload.filterAuthor,
      keyword: payload.filterKeyword,
    });

    await panel.webview.postMessage({
      type: 'COMMITS_LOADED',
      payload: {
        commits,
        page,
        pageSize,
      },
    });
  } catch (error) {
    if (error instanceof GitRepositoryNotFoundError) {
      await panel.webview.postMessage({
        type: 'GIT_REPOSITORY_NOT_FOUND',
        payload: {
          message: 'Git 저장소가 감지되지 않았습니다',
        },
      });
      return;
    }

    await panel.webview.postMessage({
      type: 'COMMITS_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : '커밋 목록을 불러오지 못했습니다',
      },
    });
  }
}

async function handleFetchChangedFiles(panel: vscode.WebviewPanel, payload: FetchChangedFilesPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: 'Git 저장소가 감지되지 않았습니다',
      },
    });
    return;
  }

  if (!payload.commitHash) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: '선택된 커밋이 없습니다',
      },
    });
    return;
  }

  try {
    const configuredSavePath = vscode.workspace.getConfiguration('gitAuthorExplorer').get<string>('savePath') || null;
    const changedFiles = await fetchChangedFiles(repoPath, payload.commitHash, payload.savePath ?? configuredSavePath);

    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOADED',
      payload: {
        files: changedFiles,
      },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : '변경 파일 목록을 불러오지 못했습니다',
      },
    });
  }
}

async function handleFetchFileDiff(panel: vscode.WebviewPanel, payload: FetchFileDiffPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: 'Git 저장소가 감지되지 않았습니다',
      },
    });
    return;
  }

  if (!payload.commitHash || !payload.filePath) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: '선택된 파일이 없습니다',
      },
    });
    return;
  }

  try {
    const diff = await fetchFileDiff(repoPath, payload.commitHash, payload.filePath);

    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOADED',
      payload: diff,
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'diff를 불러오지 못했습니다',
      },
    });
  }
}

async function handleStartAISummaryFile(panel: vscode.WebviewPanel, payload: StartAISummaryFilePayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const configuration = vscode.workspace.getConfiguration('gitAuthorExplorer');
  const provider = payload.provider ?? configuration.get<AIProviderName>('activeAIProvider') ?? null;
  const savePath = payload.savePath ?? configuration.get<string>('savePath') ?? null;

  if (!repoPath) {
    await postAISummaryError(panel, 'Git 저장소가 감지되지 않았습니다');
    return;
  }

  if (!payload.commitHash || !payload.filePath) {
    await postAISummaryError(panel, '선택된 파일이 없습니다');
    return;
  }

  if (!provider) {
    await postAISummaryError(panel, 'AI가 설정되지 않았습니다');
    return;
  }

  if (!savePath) {
    await postAISummaryError(panel, '저장 경로를 먼저 설정해주세요');
    return;
  }

  try {
    if (!payload.forceRegenerate) {
      const savedSummary = loadSummary(savePath, payload.commitHash, payload.filePath);

      if (savedSummary) {
        await panel.webview.postMessage({
          type: 'AI_SUMMARY_LOADED',
          payload: {
            content: savedSummary.content,
            savedPath: savedSummary.savedPath,
            provider,
            fromSaved: true,
          },
        });
        return;
      }
    }

    const diff = await fetchFileDiff(repoPath, payload.commitHash, payload.filePath);

    if (diff.isBinary) {
      await postAISummaryError(panel, '바이너리 파일은 AI 정리를 생성할 수 없습니다');
      return;
    }

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_TOKEN_WARNING',
      payload: {
        isOverLimit: diff.rawDiff.length > FILE_TOKEN_LIMIT_CHARS,
      },
    });

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_STARTED',
      payload: {
        provider,
      },
    });

    const prompt = buildFileSummaryPrompt(payload.filePath, diff.rawDiff);
    let content = '';

    streamAISummary({
      provider,
      prompt,
      onChunk: (chunk) => {
        content += chunk;
        void panel.webview.postMessage({
          type: 'AI_SUMMARY_CHUNK',
          payload: {
            chunk,
          },
        });
      },
      onComplete: () => {
        const savedPath = saveSummary(savePath, payload.commitHash ?? '', payload.filePath ?? '', content);
        void panel.webview.postMessage({
          type: 'AI_SUMMARY_DONE',
          payload: {
            content,
            savedPath,
            provider,
          },
        });
      },
      onError: (message) => {
        void postAISummaryError(panel, message);
      },
    });
  } catch (error) {
    await postAISummaryError(panel, error instanceof Error ? error.message : '생성에 실패했습니다');
  }
}

async function handleStartAISummaryCommit(panel: vscode.WebviewPanel, payload: StartAISummaryCommitPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const configuration = vscode.workspace.getConfiguration('gitAuthorExplorer');
  const provider = payload.provider ?? configuration.get<AIProviderName>('activeAIProvider') ?? null;
  const savePath = payload.savePath ?? configuration.get<string>('savePath') ?? null;

  if (!repoPath) {
    await postAISummaryError(panel, 'Git 저장소가 감지되지 않았습니다');
    return;
  }

  if (!payload.commitHash) {
    await postAISummaryError(panel, '선택된 커밋이 없습니다');
    return;
  }

  if (!provider) {
    await postAISummaryError(panel, 'AI가 설정되지 않았습니다');
    return;
  }

  if (!savePath) {
    await postAISummaryError(panel, '저장 경로를 먼저 설정해주세요');
    return;
  }

  try {
    if (!payload.forceRegenerate) {
      const savedSummary = loadCommitSummary(savePath, payload.commitHash);

      if (savedSummary) {
        await panel.webview.postMessage({
          type: 'AI_SUMMARY_LOADED',
          payload: {
            content: savedSummary.content,
            savedPath: savedSummary.savedPath,
            provider,
            fromSaved: true,
          },
        });
        return;
      }
    }

    const diff = await fetchCommitFullDiff(repoPath, payload.commitHash);

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_TOKEN_WARNING',
      payload: {
        isOverLimit: diff.length > COMMIT_TOKEN_LIMIT_CHARS,
      },
    });

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_STARTED',
      payload: {
        provider,
      },
    });

    const prompt = buildCommitSummaryPrompt(payload.commitHash, diff);
    let content = '';

    streamAISummary({
      provider,
      prompt,
      onChunk: (chunk) => {
        content += chunk;
        void panel.webview.postMessage({
          type: 'AI_SUMMARY_CHUNK',
          payload: {
            chunk,
          },
        });
      },
      onComplete: () => {
        const savedPath = saveCommitSummary(savePath, payload.commitHash ?? '', content);
        void panel.webview.postMessage({
          type: 'AI_SUMMARY_DONE',
          payload: {
            content,
            savedPath,
            provider,
          },
        });
      },
      onError: (message) => {
        void postAISummaryError(panel, message);
      },
    });
  } catch (error) {
    await postAISummaryError(panel, error instanceof Error ? error.message : '생성에 실패했습니다');
  }
}

async function postAISummaryError(panel: vscode.WebviewPanel, message: string): Promise<void> {
  await panel.webview.postMessage({
    type: 'AI_SUMMARY_ERROR',
    payload: {
      message,
    },
  });
}

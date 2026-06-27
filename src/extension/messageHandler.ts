import * as vscode from 'vscode';
import { AI_PROVIDERS, loadAISettingsState, registerAIProvider, setActiveAIProvider, setSavePath } from './aiProviderService';
import { streamAISummary } from './aiService';
import type { AIProviderName } from './aiTypes';
import { analyzeDependencies, DependencyCruiserNotFoundError } from './dependencyService';
import { fetchChangedFiles, fetchCommitFullDiff, fetchCommits, fetchFileDiff, GitRepositoryNotFoundError } from './gitService';
import { buildCommitSummaryPrompt, buildFileSummaryPrompt } from './prompts';
import { loadCommitSummary, loadSummary, saveCommitSummary, saveSummary } from './summaryFileService';

interface WebviewMessage {
  type: string;
  payload?:
    | FetchCommitsPayload
    | FetchChangedFilesPayload
    | FetchFileDiffPayload
    | AnalyzeDependenciesPayload
    | StartAISummaryFilePayload
    | StartAISummaryCommitPayload
    | AIProviderPayload
    | OpenExternalUrlPayload;
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

interface AIProviderPayload {
  name?: AIProviderName;
  providerName?: AIProviderName;
}

interface OpenExternalUrlPayload {
  url?: string;
}

const FILE_TOKEN_LIMIT_CHARS = 12_000;
const COMMIT_TOKEN_LIMIT_CHARS = 20_000;

export function registerMessageHandler(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
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
        await handleFetchChangedFiles(panel, context, message.payload as FetchChangedFilesPayload);
        break;
      case 'FETCH_FILE_DIFF':
        await handleFetchFileDiff(panel, message.payload as FetchFileDiffPayload);
        break;
      case 'ANALYZE_DEPENDENCIES':
        await handleAnalyzeDependencies(panel, message.payload as AnalyzeDependenciesPayload);
        break;
      case 'FETCH_AI_SUMMARY_SETTINGS':
        await handleFetchAISummarySettings(panel, context);
        break;
      case 'REGISTER_AI_PROVIDER':
        await handleRegisterAIProvider(panel, context, message.payload as AIProviderPayload);
        break;
      case 'ACTIVATE_AI_PROVIDER':
      case 'SET_ACTIVE_AI_PROVIDER':
        await handleSetActiveAIProvider(panel, context, message.payload as AIProviderPayload);
        break;
      case 'OPEN_EXTERNAL_URL':
        await handleOpenExternalUrl(message.payload as OpenExternalUrlPayload);
        break;
      case 'SET_SAVE_PATH':
        await handleSetSavePath(panel, context);
        break;
      case 'CLEAR_SAVE_PATH':
        await handleClearSavePath(panel, context);
        break;
      case 'START_AI_SUMMARY_FILE':
        await handleStartAISummaryFile(panel, context, message.payload as StartAISummaryFilePayload);
        break;
      case 'START_AI_SUMMARY_COMMIT':
        await handleStartAISummaryCommit(panel, context, message.payload as StartAISummaryCommitPayload);
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

async function handleFetchAISummarySettings(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const state = loadAISettingsState(context);

  await panel.webview.postMessage({
    type: 'AI_SUMMARY_SETTINGS_LOADED',
    payload: {
      ...state,
    },
  });
}

async function handleRegisterAIProvider(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AIProviderPayload = {}): Promise<void> {
  const providerName = payload.providerName ?? payload.name;

  if (!providerName) {
    await postAISettingsError(panel, '선택된 AI 제공자가 없습니다');
    return;
  }

  try {
    const state = await registerAIProvider(context, providerName);

    await panel.webview.postMessage({
      type: 'AI_PROVIDER_REGISTERED',
      payload: {
        ...state,
        providerName,
      },
    });
  } catch (error) {
    const provider = AI_PROVIDERS.find((candidate) => candidate.name === providerName);

    await panel.webview.postMessage({
      type: 'AI_PROVIDER_REGISTRATION_FAILED',
      payload: {
        providerName,
        installUrl: provider?.installUrl,
        message: error instanceof Error ? error.message : '연동에 실패했습니다',
      },
    });
  }
}

async function handleSetActiveAIProvider(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AIProviderPayload = {}): Promise<void> {
  const providerName = payload.providerName ?? payload.name;

  if (!providerName) {
    await postAISettingsError(panel, '선택된 AI 제공자가 없습니다');
    return;
  }

  const state = await setActiveAIProvider(context, providerName);

  await panel.webview.postMessage({
    type: 'AI_PROVIDER_STATE_UPDATED',
    payload: {
      ...state,
      providerName,
    },
  });
}

async function handleOpenExternalUrl(payload: OpenExternalUrlPayload = {}): Promise<void> {
  if (!payload.url) {
    return;
  }

  await vscode.env.openExternal(vscode.Uri.parse(payload.url));
}

async function handleSetSavePath(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const selected = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: '저장 경로 선택',
    title: 'AI 정리 저장 경로 선택',
  });

  const selectedPath = selected?.[0]?.fsPath;

  if (!selectedPath) {
    return;
  }

  const state = await setSavePath(context, selectedPath);

  await panel.webview.postMessage({
    type: 'SAVE_PATH_SET',
    payload: state,
  });
}

async function handleClearSavePath(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const state = await setSavePath(context, null);

  await panel.webview.postMessage({
    type: 'SAVE_PATH_CLEARED',
    payload: state,
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

async function handleFetchChangedFiles(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: FetchChangedFilesPayload = {}): Promise<void> {
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
    const settings = loadAISettingsState(context);
    const changedFiles = await fetchChangedFiles(repoPath, payload.commitHash, payload.savePath ?? settings.savePath);

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

async function handleStartAISummaryFile(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: StartAISummaryFilePayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const settings = loadAISettingsState(context);
  const provider = payload.provider ?? settings.activeAIProvider;
  const savePath = payload.savePath ?? settings.savePath;

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

async function handleStartAISummaryCommit(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: StartAISummaryCommitPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const settings = loadAISettingsState(context);
  const provider = payload.provider ?? settings.activeAIProvider;
  const savePath = payload.savePath ?? settings.savePath;

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

async function postAISettingsError(panel: vscode.WebviewPanel, message: string): Promise<void> {
  await panel.webview.postMessage({
    type: 'AI_SETTINGS_ERROR',
    payload: {
      message,
    },
  });
}

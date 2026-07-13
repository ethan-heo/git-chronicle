import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { useAppStore } from '../../store/appStore';
import type { AIProviderName, ChangedFile, Commit } from '../../types/commit';

const DEMO_COMMIT_SUMMARY = `### 한 줄 요약
무한 스크롤 로직을 옵저버 기반으로 전환하고 관련 훅과 테스트를 정리한 커밋.

### 변경 목적
**성능 개선 / 리팩터링.** 스크롤 이벤트의 동기 실행으로 인한 프레임 드랍을 해소하기 위해 무한 스크롤 구현 전반을 IntersectionObserver로 통일한 것으로 보임.

### 주요 변경 파일 및 포인트
- useInfiniteScroll.ts: 스크롤 핸들러 대신 IntersectionObserver 기반 감시 로직으로 재작성
- CommitList.tsx: 리스트 하단 센티넬 요소를 렌더링하도록 구조 수정
- useInfiniteScroll.test.ts: 옵저버 모킹 방식으로 테스트 갱신

### 기술적 판단 근거
훅 삭제와 신규 구현을 한 커밋에 묶은 것은 동작 동등성을 보장한 채 교체를 끝내려는 의도로 추정됨.`;

const DEMO_FILE_SUMMARY = `### 한 줄 요약
선택한 파일의 변경 로직을 정리하고 상호작용 흐름을 보강한 수정으로 보임.

### 변경 목적
**리팩터링 / 기능 보강.** 파일 단위 동작을 더 명확하게 드러내고, 사용자 상호작용에 맞춘 상태 연결을 보완하려는 의도로 추정됨.

### 주요 포인트
- 파일 내부 분기와 상태 전환 흐름을 정리
- 기존 동작을 유지하면서 선택한 파일 기준으로 결과를 보여주도록 조정

### 기술적 판단 근거
변경 범위를 단일 파일에 집중해 다루고 있어, 커밋 전체 맥락보다 해당 파일의 역할과 상호작용을 빠르게 파악하려는 목적에 가까워 보임.`;

interface StreamDemoSummaryOptions {
  forceRegenerate: boolean;
  scope: 'commit' | 'file';
  appendChunk: (chunk: string) => void;
  complete: (payload: { content?: string; savedPath?: string | null; provider?: AIProviderName | null }) => void;
}

export interface QAMessage {
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

interface SaveDraft {
  relativePath: string;
  mode: 'create' | 'overwrite';
}

interface UseAISummaryResult {
  activeAIProvider: AIProviderName | null;
  currentSummaryContent: string;
  hasCurrentSavedSummary: boolean;
  hasLoadedSettings: boolean;
  isGeneratingQA: boolean;
  isGeneratingSummary: boolean;
  isLoadingSummary: boolean;
  isRegenerateDialogOpen: boolean;
  isSavePopoverOpen: boolean;
  isSummaryTokenLimitExceeded: boolean;
  isTokenWarningDismissed: boolean;
  noteEntries: { relativePath: string; name: string; updatedAt: string }[];
  onAskQuestion: (question: string) => void;
  onConfirmRegenerate: () => void;
  onConfirmSave: (relativePath: string) => void;
  dismissTokenWarning: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
  onSave: () => void;
  qaError: string | null;
  qaMessages: QAMessage[];
  qaCompletionCount: number;
  saveDraft: SaveDraft;
  saveButtonRef: RefObject<HTMLButtonElement | null>;
  savePath: string | null;
  setIsRegenerateDialogOpen: (isOpen: boolean) => void;
  setIsSavePopoverOpen: (isOpen: boolean) => void;
  setIsTokenWarningDismissed: (isDismissed: boolean) => void;
  setSaveDraft: (draft: SaveDraft) => void;
  shouldWarnBeforeOverwrite: boolean;
  summaryError: string | null;
  summaryNoteRelativePath: string | null;
  summarySavedPath: string | null;
}

export function useAISummary(options?: {
  isActive?: boolean;
  targetFile?: ChangedFile | null;
  isTargetFilePending?: boolean;
  commit?: Commit | null;
}): UseAISummaryResult {
  const isActive = options?.isActive ?? true;
  const targetFile = options?.targetFile ?? null;
  const isTargetFilePending = options?.isTargetFilePending ?? false;
  const commit = options?.commit ?? null;
  const savePath = useAppStore((state) => state.savePath);
  const noteEntries = useAppStore((state) => state.noteTree);
  const activeAIProvider = useAppStore((state) => state.activeAIProvider);
  const summaryModel = useAppStore((state) => state.summaryModel);
  const qaModel = useAppStore((state) => state.qaModel);
  const activeSummaryTargetKey = useAppStore((state) => state.activeSummaryTargetKey);
  const summaryViewCache = useAppStore((state) => state.summaryViewCache);
  const currentSummaryContent = useAppStore((state) => state.currentSummaryContent);
  const isLoadingSummary = useAppStore((state) => state.isLoadingSummary);
  const isGeneratingSummary = useAppStore((state) => state.isGeneratingSummary);
  const isGeneratingQA = useAppStore((state) => state.isGeneratingQA);
  const summaryError = useAppStore((state) => state.summaryError);
  const qaError = useAppStore((state) => state.qaError);
  const summarySavedPath = useAppStore((state) => state.summarySavedPath);
  const summaryNoteRelativePath = useAppStore((state) => state.summaryNoteRelativePath);
  const hasCurrentSavedSummary = useAppStore((state) => state.hasCurrentSavedSummary);
  const isSummaryTokenLimitExceeded = useAppStore((state) => state.isSummaryTokenLimitExceeded);
  const setAISummarySettings = useAppStore((state) => state.setAISummarySettings);
  const startAISummaryLoading = useAppStore((state) => state.startAISummaryLoading);
  const startAISummaryGeneration = useAppStore((state) => state.startAISummaryGeneration);
  const appendAISummaryChunk = useAppStore((state) => state.appendAISummaryChunk);
  const completeAISummary = useAppStore((state) => state.completeAISummary);
  const startAIQA = useAppStore((state) => state.startAIQA);
  const completeAIQA = useAppStore((state) => state.completeAIQA);
  const failAIQA = useAppStore((state) => state.failAIQA);
  const setSummaryTokenWarning = useAppStore((state) => state.setSummaryTokenWarning);
  const markCurrentSummarySaved = useAppStore((state) => state.markCurrentSummarySaved);
  const loadNoteTree = useAppStore((state) => state.loadNoteTree);

  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
  const [isTokenWarningDismissed, setIsTokenWarningDismissed] = useState(false);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(!isVSCodeRuntime());
  const [qaMessages, setQAMessages] = useState<QAMessage[]>([]);
  const [qaCompletionCount, setQACompletionCount] = useState(0);
  const [saveDraft, setSaveDraft] = useState<SaveDraft>({ relativePath: '', mode: 'create' });
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);
  const qaResetKey = `${commit?.hash ?? ''}::${targetFile?.path ?? ''}`;
  const [prevQAResetKey, setPrevQAResetKey] = useState(qaResetKey);

  if (prevQAResetKey !== qaResetKey) {
    setPrevQAResetKey(qaResetKey);
    setQAMessages([]);
    setQACompletionCount(0);
  }

  const canStartSummary = Boolean(commit && activeAIProvider && savePath);
  const summaryScope = targetFile ? 'file' : 'commit';
  const summaryTargetKey = `${commit?.hash ?? 'none'}::${targetFile?.path ?? '__commit__'}`;
  const cachedSummary = summaryViewCache[summaryTargetKey] ?? null;
  const isActiveSummaryTarget = activeSummaryTargetKey === summaryTargetKey;
  const displayedSummaryContent = isActiveSummaryTarget ? currentSummaryContent : (cachedSummary?.content ?? '');
  const displayedSavedPath = isActiveSummaryTarget ? summarySavedPath : (cachedSummary?.savedPath ?? null);
  const displayedNoteRelativePath = isActiveSummaryTarget ? summaryNoteRelativePath : (cachedSummary?.noteRelativePath ?? null);
  const displayedHasSavedSummary = isActiveSummaryTarget ? hasCurrentSavedSummary : Boolean(cachedSummary?.hasSavedSummary);
  const displayedSummaryError = isActiveSummaryTarget ? summaryError : null;
  const displayedIsLoadingSummary = isActiveSummaryTarget ? isLoadingSummary : false;
  const displayedIsGeneratingSummary = isActiveSummaryTarget ? isGeneratingSummary : false;
  const displayedIsGeneratingQA = isActiveSummaryTarget ? isGeneratingQA : false;
  const displayedIsSummaryTokenLimitExceeded = isActiveSummaryTarget ? isSummaryTokenLimitExceeded : false;
  const shouldWarnBeforeOverwrite = Boolean(displayedNoteRelativePath && !displayedHasSavedSummary);

  const startSummary = useCallback((forceRegenerate = false): void => {
    if (!commit || !activeAIProvider || !savePath) {
      return;
    }

    setSummaryTokenWarning(false);
    setIsTokenWarningDismissed(false);

    if (!isVSCodeRuntime()) {
      startAISummaryGeneration({
        preserveSavedSummary: forceRegenerate,
        targetKey: summaryTargetKey,
        commitHash: commit.hash,
      });
      streamDemoSummary({
        forceRegenerate,
        scope: summaryScope,
        appendChunk: appendAISummaryChunk,
        complete: (payload) => completeAISummary({
          ...payload,
          scope: summaryScope,
          commitHash: commit.hash,
          targetKey: summaryTargetKey,
        }),
      });
      return;
    }

    startAISummaryLoading({
      preserveSavedSummary: forceRegenerate,
      commitHash: commit.hash,
      targetKey: summaryTargetKey,
    });

    const basePayload = {
      commitHash: commit.hash,
      commitMessage: commit.message,
      provider: activeAIProvider,
      summaryModel,
      savePath,
      forceRegenerate,
    };

    if (targetFile) {
      postMessage('START_AI_SUMMARY_FILE', { ...basePayload, filePath: targetFile.path });
      return;
    }

    postMessage('START_AI_SUMMARY_COMMIT', basePayload);
  }, [activeAIProvider, appendAISummaryChunk, commit, completeAISummary, savePath, setSummaryTokenWarning, startAISummaryGeneration, startAISummaryLoading, summaryModel, summaryScope, summaryTargetKey, targetFile]);

  const askQuestion = useCallback((question: string): void => {
    if (!commit || !activeAIProvider || !savePath || !displayedSummaryContent || !qaModel || !displayedNoteRelativePath) {
      return;
    }

    setQAMessages((prev) => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: '', isStreaming: true },
    ]);
    startAIQA();

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        setQAMessages((prev) => {
          const next = [...prev];
          const last = next.at(-1);
          if (last?.role === 'assistant') {
            next[next.length - 1] = {
              ...last,
              text: '현재 데모 환경에서는 요약 본문 기준으로만 답변합니다.',
              isStreaming: false,
            };
          }
          return next;
        });
        completeAIQA({
          appendedContent: `\n\n---\n\n### Q. ${question}\n\n현재 데모 환경에서는 요약 본문 기준으로만 답변합니다.\n`,
        });
        setQACompletionCount((count) => count + 1);
      }, 500);
      return;
    }

    postMessage('START_AI_QA', {
      question,
      summaryContent: displayedSummaryContent,
      commitHash: commit.hash,
      commitMessage: commit.message,
      filePath: targetFile?.path,
      provider: activeAIProvider,
      qaModel,
      savePath,
      noteRelativePath: displayedNoteRelativePath,
    });
  }, [activeAIProvider, commit, completeAIQA, displayedNoteRelativePath, displayedSummaryContent, qaModel, savePath, startAIQA, targetFile]);

  const openSavePopover = useCallback(() => {
    if (!displayedSummaryContent) {
      return;
    }

    const relativePath = displayedHasSavedSummary || displayedNoteRelativePath
      ? displayedNoteRelativePath ?? ''
      : '';
    setSaveDraft({
      relativePath,
      mode: relativePath ? 'overwrite' : 'create',
    });
    setIsSavePopoverOpen(true);

    if (isVSCodeRuntime() && savePath) {
      loadNoteTree();
      postMessage('FETCH_NOTE_TREE', { savePath });
    }
  }, [displayedHasSavedSummary, displayedNoteRelativePath, displayedSummaryContent, loadNoteTree, savePath]);

  const confirmSave = useCallback((relativePath: string) => {
    if (!commit || !savePath || !displayedSummaryContent) {
      return;
    }

    const trimmed = relativePath.trim();
    if (!trimmed) {
      return;
    }

    const linkContext = {
      commitHash: commit.hash,
      filePath: targetFile?.path,
      scope: summaryScope,
      commitMessage: commit.message,
    } as const;

    if (!isVSCodeRuntime()) {
      const normalized = ensureDemoAiNotePath(trimmed);
      markCurrentSummarySaved({
        content: displayedSummaryContent,
        savedPath: `${savePath}/${normalized}`,
        noteRelativePath: normalized,
        provider: activeAIProvider,
        commitHash: commit.hash,
        targetKey: summaryTargetKey,
      });
      setIsSavePopoverOpen(false);
      return;
    }

    const normalized = ensureDemoAiNotePath(trimmed);
    const noteExists = noteEntries.some((entry) => entry.relativePath === normalized);

    postMessage(noteExists ? 'SAVE_NOTE' : 'CREATE_NOTE', {
      savePath,
      relativePath: normalized,
      content: displayedSummaryContent,
      linkContext,
    });
    setIsSavePopoverOpen(false);
  }, [activeAIProvider, commit, displayedSummaryContent, markCurrentSummarySaved, noteEntries, savePath, summaryScope, summaryTargetKey, targetFile?.path]);

  useEffect(() => {
    if (isVSCodeRuntime()) {
      postMessage('FETCH_AI_SUMMARY_SETTINGS');
    }
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; payload?: { activeAIProvider?: AIProviderName | null; registeredProviders?: AIProviderName[]; savePath?: string | null; summaryModel?: string | null; qaModel?: string | null; isOverLimit?: boolean; chunk?: string; content?: string; savedPath?: string | null; message?: string; appendedContent?: string; noteRelativePath?: string | null; provider?: AIProviderName | null } }>): void => {
      if (event.data.type === 'AI_SUMMARY_SETTINGS_LOADED') {
        setAISummarySettings({
          savePath: event.data.payload?.savePath ?? null,
          registeredProviders: event.data.payload?.registeredProviders ?? [],
          activeAIProvider: event.data.payload?.activeAIProvider ?? null,
          summaryModel: event.data.payload?.summaryModel ?? null,
          qaModel: event.data.payload?.qaModel ?? null,
        });
        setHasLoadedSettings(true);
        return;
      }

      if (event.data.type === 'AI_QA_CHUNK') {
        const chunk = event.data.payload?.chunk ?? '';
        setQAMessages((prev) => {
          const next = [...prev];
          const last = next.at(-1);
          if (last?.role === 'assistant') {
            next[next.length - 1] = { ...last, text: `${last.text}${chunk}` };
          }
          return next;
        });
        return;
      }

      if (event.data.type === 'AI_QA_COMPLETE') {
        setQAMessages((prev) => {
          const next = [...prev];
          const last = next.at(-1);
          if (last?.role === 'assistant') {
            next[next.length - 1] = { ...last, isStreaming: false };
          }
          return next;
        });
        completeAIQA({ appendedContent: event.data.payload?.appendedContent ?? '' });
        setQACompletionCount((count) => count + 1);
        return;
      }

      if (event.data.type === 'AI_QA_ERROR') {
        setQAMessages((prev) => {
          const next = [...prev];
          const last = next.at(-1);
          if (last?.role === 'assistant' && !last.text) {
            next.pop();
          } else if (last?.role === 'assistant') {
            next[next.length - 1] = { ...last, isStreaming: false };
          }
          return next;
        });
        failAIQA(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [completeAIQA, failAIQA, setAISummarySettings]);

  useEffect(() => {
    if (!isActive || !hasLoadedSettings || !canStartSummary || isTargetFilePending || displayedSummaryContent || displayedIsLoadingSummary || displayedIsGeneratingSummary || displayedSummaryError) {
      return;
    }
    startSummary(false);
  }, [canStartSummary, displayedIsGeneratingSummary, displayedIsLoadingSummary, displayedSummaryContent, displayedSummaryError, hasLoadedSettings, isActive, isTargetFilePending, startSummary]);

  return {
    activeAIProvider,
    currentSummaryContent: displayedSummaryContent,
    hasCurrentSavedSummary: displayedHasSavedSummary,
    hasLoadedSettings,
    isGeneratingQA: displayedIsGeneratingQA,
    isGeneratingSummary: displayedIsGeneratingSummary,
    isLoadingSummary: displayedIsLoadingSummary,
    isRegenerateDialogOpen,
    isSavePopoverOpen,
    isSummaryTokenLimitExceeded: displayedIsSummaryTokenLimitExceeded,
    isTokenWarningDismissed,
    noteEntries,
    onAskQuestion: askQuestion,
    onConfirmRegenerate: () => {
      setIsRegenerateDialogOpen(false);
      startSummary(true);
    },
    onConfirmSave: confirmSave,
    dismissTokenWarning: () => setIsTokenWarningDismissed(true),
    onRegenerate: () => setIsRegenerateDialogOpen(true),
    onRetry: () => startSummary(true),
    onSave: openSavePopover,
    qaError,
    qaMessages,
    qaCompletionCount,
    saveDraft,
    saveButtonRef,
    savePath,
    setIsRegenerateDialogOpen,
    setIsSavePopoverOpen,
    setIsTokenWarningDismissed,
    setSaveDraft,
    shouldWarnBeforeOverwrite,
    summaryError: displayedSummaryError,
    summaryNoteRelativePath: displayedNoteRelativePath,
    summarySavedPath: displayedSavedPath,
  };
}

function ensureDemoAiNotePath(relativePath: string): string {
  const normalized = relativePath.replaceAll('\\', '/').trim().replace(/^\/+|\/+$/g, '');
  const parts = normalized.split('/').filter(Boolean);
  const fileName = parts.at(-1) ?? 'untitled';
  const suffixless = fileName.includes('.') ? fileName.split('.')[0] : fileName;
  parts[parts.length - 1] = `${suffixless}.ai.md`;

  return parts.join('/');
}

function streamDemoSummary(options: StreamDemoSummaryOptions): void {
  let index = 0;
  const baseContent = options.scope === 'file' ? DEMO_FILE_SUMMARY : DEMO_COMMIT_SUMMARY;
  const content = options.forceRegenerate ? `${baseContent}\n` : baseContent;

  const timer = window.setInterval(() => {
    const next = content.slice(index, index + 8);
    index += next.length;
    options.appendChunk(next);
    if (index >= content.length) {
      window.clearInterval(timer);
      options.complete({
        content,
        savedPath: null,
        provider: 'claude',
      });
    }
  }, 24);
}

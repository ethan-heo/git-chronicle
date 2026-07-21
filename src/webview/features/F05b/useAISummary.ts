import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { useAppStore } from '../../store/appStore';
import type { AIProviderName, AIUsageInfo, ChangedFile, Commit } from '../../types/commit';

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
  complete: (payload: { content?: string; savedPath?: string | null; provider?: AIProviderName | null; usage?: AIUsageInfo | null }) => void;
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
  currentSummaryUsage: AIUsageInfo | null;
  hasCurrentSavedSummary: boolean;
  hasLoadedSettings: boolean;
  isGeneratingQA: boolean;
  isGeneratingSummary: boolean;
  isLoadingSummary: boolean;
  isRegenerateDialogOpen: boolean;
  isSavePopoverOpen: boolean;
  noteEntries: { relativePath: string; name: string; updatedAt: string }[];
  onAskQuestion: (question: string) => void;
  onConfirmRegenerate: () => void;
  onConfirmSave: (relativePath: string) => void;
  onRegenerate: () => void;
  onRetry: () => void;
  onSave: () => void;
  qaMessages: QAMessage[];
  qaCompletionCount: number;
  saveDraft: SaveDraft;
  saveButtonRef: RefObject<HTMLButtonElement | null>;
  savePath: string | null;
  setIsRegenerateDialogOpen: (isOpen: boolean) => void;
  setIsSavePopoverOpen: (isOpen: boolean) => void;
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
  const { t } = useTranslation();
  const isActive = options?.isActive ?? true;
  const targetFile = options?.targetFile ?? null;
  const isTargetFilePending = options?.isTargetFilePending ?? false;
  const commit = options?.commit ?? null;
  const savePath = useAppStore((state) => state.savePath);
  const noteEntries = useAppStore((state) => state.noteTree);
  const activeAIProvider = useAppStore((state) => state.activeAIProvider);
  const summaryModel = useAppStore((state) => state.summaryModel);
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
  const pushToast = useAppStore((state) => state.pushToast);

  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
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

  // 활성 대상 여부를 selector 안에서 직접 판정해, 다른 탭/파일의 요약을 보는 인스턴스는
  // activeSummaryTargetKey가 자신과 다른 한 currentSummaryContent 등 스트리밍 원본 필드가
  // 바뀌어도 selector 반환값이 그대로라 리렌더되지 않는다(스트리밍 청크마다 전체 인스턴스가
  // 리렌더되는 것을 방지).
  const displayedSummaryContent = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.currentSummaryContent : (state.summaryViewCache[summaryTargetKey]?.content ?? '')
  ));
  const displayedSavedPath = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.summarySavedPath : (state.summaryViewCache[summaryTargetKey]?.savedPath ?? null)
  ));
  const displayedNoteRelativePath = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.summaryNoteRelativePath : (state.summaryViewCache[summaryTargetKey]?.noteRelativePath ?? null)
  ));
  const displayedSummaryUsage = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.currentSummaryUsage : (state.summaryViewCache[summaryTargetKey]?.usage ?? null)
  ));
  const displayedHasSavedSummary = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.hasCurrentSavedSummary : Boolean(state.summaryViewCache[summaryTargetKey]?.hasSavedSummary)
  ));
  const displayedSummaryError = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.summaryError : null
  ));
  const displayedIsLoadingSummary = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.isLoadingSummary : false
  ));
  const displayedIsGeneratingSummary = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.isGeneratingSummary : false
  ));
  const displayedIsGeneratingQA = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.isGeneratingQA : false
  ));
  const displayedIsSummaryTokenLimitExceeded = useAppStore((state) => (
    state.activeSummaryTargetKey === summaryTargetKey ? state.isSummaryTokenLimitExceeded : false
  ));
  const shouldWarnBeforeOverwrite = Boolean(displayedNoteRelativePath && !displayedHasSavedSummary);
  const lastStatusToastKeyRef = useRef<string | null>(null);

  const startSummary = useCallback((forceRegenerate = false): void => {
    if (!commit || !activeAIProvider || !savePath) {
      return;
    }

    setSummaryTokenWarning(false);
    lastStatusToastKeyRef.current = null;

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
          usage: null,
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
    if (!commit || !activeAIProvider || !savePath || !displayedSummaryContent || !summaryModel || !displayedNoteRelativePath) {
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
      savePath,
      noteRelativePath: displayedNoteRelativePath,
    });
  }, [activeAIProvider, commit, completeAIQA, displayedNoteRelativePath, displayedSummaryContent, savePath, startAIQA, summaryModel, targetFile]);

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
    const handler = (event: MessageEvent<{ type: string; payload?: { activeAIProvider?: AIProviderName | null; registeredProviders?: AIProviderName[]; savePath?: string | null; summaryModel?: string | null; isOverLimit?: boolean; chunk?: string; content?: string; savedPath?: string | null; message?: string; appendedContent?: string; noteRelativePath?: string | null; provider?: AIProviderName | null } }>): void => {
      if (event.data.type === 'AI_SUMMARY_SETTINGS_LOADED') {
        setAISummarySettings({
          savePath: event.data.payload?.savePath ?? null,
          registeredProviders: event.data.payload?.registeredProviders ?? [],
          activeAIProvider: event.data.payload?.activeAIProvider ?? null,
          summaryModel: event.data.payload?.summaryModel ?? null,
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

  useEffect(() => {
    if (!isActive || !hasLoadedSettings) {
      return;
    }

    if (!activeAIProvider) {
      const nextKey = 'no-ai';
      if (lastStatusToastKeyRef.current !== nextKey) {
        pushToast(t('ai_summary.no_ai'), 'warning');
        lastStatusToastKeyRef.current = nextKey;
      }
      return;
    }

    if (!savePath) {
      const nextKey = 'no-save-path';
      if (lastStatusToastKeyRef.current !== nextKey) {
        pushToast(t('ai_summary.no_save_path'), 'warning');
        lastStatusToastKeyRef.current = nextKey;
      }
      return;
    }

    if (displayedSummaryError) {
      const nextKey = `summary-error:${displayedSummaryError}`;
      if (lastStatusToastKeyRef.current !== nextKey) {
        pushToast(displayedSummaryError, 'error');
        lastStatusToastKeyRef.current = nextKey;
      }
      return;
    }

    if (displayedIsSummaryTokenLimitExceeded) {
      const nextKey = 'token-warning';
      if (lastStatusToastKeyRef.current !== nextKey) {
        pushToast(t('ai_summary.token_warning'), 'warning');
        lastStatusToastKeyRef.current = nextKey;
      }
      return;
    }

    lastStatusToastKeyRef.current = null;
  }, [
    activeAIProvider,
    displayedIsSummaryTokenLimitExceeded,
    displayedSummaryError,
    hasLoadedSettings,
    isActive,
    pushToast,
    savePath,
    t,
  ]);

  return {
    activeAIProvider,
    currentSummaryContent: displayedSummaryContent,
    currentSummaryUsage: displayedSummaryUsage,
    hasCurrentSavedSummary: displayedHasSavedSummary,
    hasLoadedSettings,
    isGeneratingQA: displayedIsGeneratingQA,
    isGeneratingSummary: displayedIsGeneratingSummary,
    isLoadingSummary: displayedIsLoadingSummary,
    isRegenerateDialogOpen,
    isSavePopoverOpen,
    noteEntries,
    onAskQuestion: askQuestion,
    onConfirmRegenerate: () => {
      setIsRegenerateDialogOpen(false);
      startSummary(true);
    },
    onConfirmSave: confirmSave,
    onRegenerate: () => setIsRegenerateDialogOpen(true),
    onRetry: () => startSummary(true),
    onSave: openSavePopover,
    qaMessages,
    qaCompletionCount,
    saveDraft,
    saveButtonRef,
    savePath,
    setIsRegenerateDialogOpen,
    setIsSavePopoverOpen,
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

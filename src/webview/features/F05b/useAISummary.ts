import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  commitHash: string;
  commitMessage: string;
  filePath?: string | null;
  scope: 'commit' | 'file';
  appendChunk: (chunk: string) => void;
  complete: (payload: { content?: string; savedPath?: string | null; provider?: AIProviderName | null }) => void;
}

export interface QAMessage {
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

interface UseAISummaryResult {
  activeAIProvider: AIProviderName | null;
  currentSummaryContent: string;
  headerContext: string;
  hasCurrentSavedSummary: boolean;
  hasLoadedSettings: boolean;
  isDialogOpen: boolean;
  isGeneratingQA: boolean;
  isGeneratingSummary: boolean;
  isLoadingSummary: boolean;
  isSummaryTokenLimitExceeded: boolean;
  isTokenWarningDismissed: boolean;
  onAskQuestion: (question: string) => void;
  onConfirmRegenerate: () => void;
  dismissTokenWarning: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
  savePath: string | null;
  selectedCommit: Commit | null;
  setIsDialogOpen: (isOpen: boolean) => void;
  setIsTokenWarningDismissed: (isDismissed: boolean) => void;
  qaError: string | null;
  qaMessages: QAMessage[];
  qaCompletionCount: number;
  summaryError: string | null;
  summarySavedPath: string | null;
}

export function useAISummary(options?: { isActive?: boolean; targetFile?: ChangedFile | null }): UseAISummaryResult {
  const isActive = options?.isActive ?? true;
  const targetFile = options?.targetFile ?? null;
  const { t } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const savePath = useAppStore((state) => state.savePath);
  const activeAIProvider = useAppStore((state) => state.activeAIProvider);
  const summaryModel = useAppStore((state) => state.summaryModel);
  const qaModel = useAppStore((state) => state.qaModel);
  const currentSummaryContent = useAppStore((state) => state.currentSummaryContent);
  const isLoadingSummary = useAppStore((state) => state.isLoadingSummary);
  const isGeneratingSummary = useAppStore((state) => state.isGeneratingSummary);
  const isGeneratingQA = useAppStore((state) => state.isGeneratingQA);
  const summaryError = useAppStore((state) => state.summaryError);
  const qaError = useAppStore((state) => state.qaError);
  const summarySavedPath = useAppStore((state) => state.summarySavedPath);
  const hasCurrentSavedSummary = useAppStore((state) => state.hasCurrentSavedSummary);
  const isSummaryTokenLimitExceeded = useAppStore((state) => state.isSummaryTokenLimitExceeded);
  const setAISummarySettings = useAppStore((state) => state.setAISummarySettings);
  const startAISummaryLoading = useAppStore((state) => state.startAISummaryLoading);
  const startAISummaryGeneration = useAppStore((state) => state.startAISummaryGeneration);
  const appendAISummaryChunk = useAppStore((state) => state.appendAISummaryChunk);
  const completeAISummary = useAppStore((state) => state.completeAISummary);
  const loadSavedAISummary = useAppStore((state) => state.loadSavedAISummary);
  const failAISummary = useAppStore((state) => state.failAISummary);
  const startAIQA = useAppStore((state) => state.startAIQA);
  const completeAIQA = useAppStore((state) => state.completeAIQA);
  const failAIQA = useAppStore((state) => state.failAIQA);
  const setSummaryTokenWarning = useAppStore((state) => state.setSummaryTokenWarning);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTokenWarningDismissed, setIsTokenWarningDismissed] = useState(false);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(!isVSCodeRuntime());
  const [qaMessages, setQAMessages] = useState<QAMessage[]>([]);
  const [qaCompletionCount, setQACompletionCount] = useState(0);

  const canStartSummary = Boolean(selectedCommit && activeAIProvider && savePath);
  const summaryScope = targetFile ? 'file' : 'commit';

  const headerContext = useMemo(() => {
    if (!selectedCommit) return t('shared.loading');
    return [
      targetFile ? targetFile.path : '커밋 전체 요약',
      t('ai_summary.ai_result'),
      activeAIProvider,
      hasCurrentSavedSummary ? t('shared.saved') : null,
    ].filter(Boolean).join(' · ');
  }, [activeAIProvider, hasCurrentSavedSummary, selectedCommit, t, targetFile]);

  const startSummary = useCallback(
    (forceRegenerate = false): void => {
      if (!selectedCommit || !activeAIProvider || !savePath) return;

      setSummaryTokenWarning(false);
      setIsTokenWarningDismissed(false);

      if (!isVSCodeRuntime()) {
        startAISummaryGeneration({ preserveSavedSummary: forceRegenerate });
        streamDemoSummary({
          forceRegenerate,
          commitHash: selectedCommit.shortHash,
          commitMessage: selectedCommit.message,
          filePath: targetFile?.path ?? null,
          scope: summaryScope,
          appendChunk: appendAISummaryChunk,
          complete: (payload) => completeAISummary({ ...payload, scope: summaryScope }),
        });
        return;
      }

      startAISummaryLoading({ preserveSavedSummary: forceRegenerate });
      if (targetFile) {
        postMessage('START_AI_SUMMARY_FILE', {
          commitHash: selectedCommit.hash,
          commitMessage: selectedCommit.message,
          filePath: targetFile.path,
          provider: activeAIProvider,
          summaryModel,
          savePath,
          forceRegenerate,
        });
        return;
      }

      postMessage('START_AI_SUMMARY_COMMIT', {
        commitHash: selectedCommit.hash,
        commitMessage: selectedCommit.message,
        provider: activeAIProvider,
        summaryModel,
        savePath,
        forceRegenerate,
      });
    },
    [activeAIProvider, appendAISummaryChunk, completeAISummary, savePath, selectedCommit, setSummaryTokenWarning, startAISummaryGeneration, startAISummaryLoading, summaryModel, summaryScope, targetFile],
  );

  const askQuestion = useCallback(
    (question: string): void => {
      if (!selectedCommit || !activeAIProvider || !savePath || !currentSummaryContent || !qaModel) {
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
                text: '현재 데모 환경에서는 요약 본문 기준으로만 답변하며, 이번 변경은 구조 단순화와 성능 개선을 목표로 한 수정으로 보입니다.',
                isStreaming: false,
              };
            }
            return next;
          });
          completeAIQA({
            appendedContent: `\n\n---\n\n### Q. ${question}\n\n현재 데모 환경에서는 요약 본문 기준으로만 답변하며, 이번 변경은 구조 단순화와 성능 개선을 목표로 한 수정으로 보입니다.\n`,
          });
          setQACompletionCount((count) => count + 1);
        }, 500);
        return;
      }

      postMessage('START_AI_QA', {
        question,
        summaryContent: currentSummaryContent,
        commitHash: selectedCommit.hash,
        commitMessage: selectedCommit.message,
        filePath: targetFile?.path,
        provider: activeAIProvider,
        qaModel,
        savePath,
      });
    },
    [activeAIProvider, completeAIQA, currentSummaryContent, qaModel, savePath, selectedCommit, startAIQA, targetFile],
  );

  useEffect(() => {
    if (isVSCodeRuntime()) {
      postMessage('FETCH_AI_SUMMARY_SETTINGS');
    }
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; payload?: { activeAIProvider?: AIProviderName | null; registeredProviders?: AIProviderName[]; savePath?: string | null; summaryModel?: string | null; qaModel?: string | null; isOverLimit?: boolean; chunk?: string; content?: string; savedPath?: string | null; provider?: AIProviderName | null; message?: string; appendedContent?: string } }>): void => {
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
      if (event.data.type === 'AI_SUMMARY_STARTED') {
        startAISummaryGeneration({ preserveSavedSummary: hasCurrentSavedSummary });
        return;
      }
      if (event.data.type === 'AI_SUMMARY_TOKEN_WARNING') {
        setSummaryTokenWarning(Boolean(event.data.payload?.isOverLimit));
        return;
      }
      if (event.data.type === 'AI_SUMMARY_CHUNK') {
        appendAISummaryChunk(event.data.payload?.chunk ?? '');
        return;
      }
      if (event.data.type === 'AI_SUMMARY_LOADED') {
        loadSavedAISummary({ content: event.data.payload?.content ?? '', savedPath: event.data.payload?.savedPath ?? null, provider: event.data.payload?.provider ?? null, scope: summaryScope });
        return;
      }
      if (event.data.type === 'AI_SUMMARY_DONE') {
        completeAISummary({ content: event.data.payload?.content, savedPath: event.data.payload?.savedPath ?? null, provider: event.data.payload?.provider ?? null, scope: summaryScope });
        return;
      }
      if (event.data.type === 'AI_SUMMARY_ERROR') {
        failAISummary(event.data.payload?.message);
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
  }, [appendAISummaryChunk, completeAIQA, completeAISummary, failAIQA, failAISummary, hasCurrentSavedSummary, loadSavedAISummary, setAISummarySettings, setSummaryTokenWarning, startAISummaryGeneration, summaryScope]);

  useEffect(() => {
    setQAMessages([]);
    setQACompletionCount(0);
  }, [selectedCommit?.hash, targetFile?.path]);

  useEffect(() => {
    if (!isActive || !hasLoadedSettings || !canStartSummary || currentSummaryContent || isLoadingSummary || isGeneratingSummary || summaryError) return;
    startSummary(false);
  }, [canStartSummary, currentSummaryContent, hasLoadedSettings, isActive, isGeneratingSummary, isLoadingSummary, startSummary, summaryError]);

  return {
    activeAIProvider,
    currentSummaryContent,
    headerContext,
    hasCurrentSavedSummary,
    hasLoadedSettings,
    isDialogOpen,
    isGeneratingQA,
    isGeneratingSummary,
    isLoadingSummary,
    isSummaryTokenLimitExceeded,
    isTokenWarningDismissed,
    onAskQuestion: askQuestion,
    onConfirmRegenerate: () => {
      setIsDialogOpen(false);
      startSummary(true);
    },
    dismissTokenWarning: () => setIsTokenWarningDismissed(true),
    onRegenerate: () => setIsDialogOpen(true),
    onRetry: () => startSummary(true),
    savePath,
    selectedCommit,
    setIsDialogOpen,
    setIsTokenWarningDismissed,
    qaError,
    qaMessages,
    qaCompletionCount,
    summaryError,
    summarySavedPath,
  };
}

function toDemoCommitDirName(shortHash: string, commitMessage: string): string {
  const sanitized = commitMessage.replace(/[^A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, '').replace(/\s+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return `${shortHash}_${sanitized || 'commit'}`;
}

function streamDemoSummary(options: StreamDemoSummaryOptions): void {
  let index = 0;
  const baseContent = options.scope === 'file' ? DEMO_FILE_SUMMARY : DEMO_COMMIT_SUMMARY;
  const content = options.forceRegenerate ? `${baseContent}\n` : baseContent;
  const commitDirName = toDemoCommitDirName(options.commitHash, options.commitMessage);
  const timer = window.setInterval(() => {
    const next = content.slice(index, index + 8);
    index += next.length;
    options.appendChunk(next);
    if (index >= content.length) {
      window.clearInterval(timer);
      options.complete({
        content,
        savedPath:
          options.scope === 'file' && options.filePath
            ? `.git-author/${commitDirName}/${options.filePath.replace(/[\\/]/g, '__')}.md`
            : `.git-author/${commitDirName}/전체_파일_정리.md`,
        provider: 'claude',
      });
    }
  }, 24);
}

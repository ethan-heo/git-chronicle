import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { useAppStore } from '../../store/appStore';
import type { AIProviderName } from '../../types/commit';

const DEMO_SUMMARY = `### 한 줄 요약
스크롤 이벤트 기반 무한 로딩을 IntersectionObserver 방식으로 교체하여 성능과 안정성을 개선함.

### 변경 목적
**성능 개선 / 리팩터링.** 기존 scroll 핸들러는 매 스크롤마다 동기적으로 실행되어 리스트가 길어질수록 프레임 드랍이 발생했음. 이를 브라우저가 비동기로 처리하는 IntersectionObserver로 대체한 것으로 보임.

### 주요 변경 포인트
- handleScroll 콜백과 scrollHeight 직접 계산 로직 제거
- 리스트 하단을 감시할 sentinelRef 요소 도입
- rootMargin 설정으로 뷰포트 도달 전 미리 로드
- cleanup 단계에서 observer.disconnect() 호출로 메모리 누수 방지

### 기술적 판단 근거
scroll 대신 IntersectionObserver를 택한 것은 메인 스레드 부하를 줄이려는 의도로 추정됨.`;

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

interface StreamDemoSummaryOptions {
  forceRegenerate: boolean;
  summaryMode: 'file' | 'commit';
  commitHash: string;
  commitMessage: string;
  filePath: string | null;
  appendChunk: (chunk: string) => void;
  complete: (payload: { content?: string; savedPath?: string | null; provider?: AIProviderName | null }) => void;
}

export function useAISummary(options?: { isActive?: boolean }) {
  const isActive = options?.isActive ?? true;
  const { t } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const summaryMode = useAppStore((state) => state.summaryMode);
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
  const [qaStreamingResponse, setQAStreamingResponse] = useState('');

  const canStartSummary = Boolean(selectedCommit && activeAIProvider && savePath && (summaryMode === 'commit' || selectedFile));

  const headerContext = useMemo(() => {
    if (!selectedCommit) return t('shared.loading');
    if (summaryMode === 'commit') {
      return ['커밋 전체 요약', t('ai_summary.ai_result'), activeAIProvider, hasCurrentSavedSummary ? t('shared.saved') : null].filter(Boolean).join(' · ');
    }
    return `${selectedCommit.shortHash} > ${selectedFile?.path ?? ''} · ${t('ai_summary.split_view')}`;
  }, [activeAIProvider, hasCurrentSavedSummary, selectedCommit, selectedFile?.path, summaryMode, t]);

  const startSummary = useCallback(
    (forceRegenerate = false): void => {
      if (!selectedCommit || !activeAIProvider || !savePath) return;
      if (summaryMode === 'file' && !selectedFile) return;

      setSummaryTokenWarning(false);
      setIsTokenWarningDismissed(false);

      if (!isVSCodeRuntime()) {
        startAISummaryGeneration({ preserveSavedSummary: forceRegenerate });
        streamDemoSummary({
          forceRegenerate,
          summaryMode,
          commitHash: selectedCommit.shortHash,
          commitMessage: selectedCommit.message,
          filePath: selectedFile?.path ?? null,
          appendChunk: appendAISummaryChunk,
          complete: completeAISummary,
        });
        return;
      }

      startAISummaryLoading({ preserveSavedSummary: forceRegenerate });
      if (summaryMode === 'commit') {
        postMessage('START_AI_SUMMARY_COMMIT', {
          commitHash: selectedCommit.hash,
          commitMessage: selectedCommit.message,
          provider: activeAIProvider,
          summaryModel,
          savePath,
          forceRegenerate,
        });
        return;
      }

      postMessage('START_AI_SUMMARY_FILE', {
        commitHash: selectedCommit.hash,
        commitMessage: selectedCommit.message,
        filePath: selectedFile?.path,
        provider: activeAIProvider,
        summaryModel,
        savePath,
        forceRegenerate,
      });
    },
    [activeAIProvider, appendAISummaryChunk, completeAISummary, savePath, selectedCommit, selectedFile, setSummaryTokenWarning, startAISummaryGeneration, startAISummaryLoading, summaryMode, summaryModel],
  );

  const askQuestion = useCallback(
    (question: string): void => {
      if (!selectedCommit || !activeAIProvider || !savePath || !currentSummaryContent || !qaModel) {
        return;
      }

      startAIQA();
      setQAStreamingResponse('');

      if (!isVSCodeRuntime()) {
        window.setTimeout(() => {
          completeAIQA({
            appendedContent: `\n\n---\n\n### Q. ${question}\n\n현재 데모 환경에서는 요약 본문 기준으로만 답변하며, 이번 변경은 구조 단순화와 성능 개선을 목표로 한 수정으로 보입니다.\n`,
          });
        }, 500);
        return;
      }

      postMessage('START_AI_QA', {
        question,
        summaryContent: currentSummaryContent,
        commitHash: selectedCommit.hash,
        commitMessage: selectedCommit.message,
        filePath: summaryMode === 'file' ? selectedFile?.path : undefined,
        summaryMode,
        provider: activeAIProvider,
        qaModel,
        savePath,
      });
    },
    [activeAIProvider, completeAIQA, currentSummaryContent, qaModel, savePath, selectedCommit, selectedFile?.path, startAIQA, summaryMode],
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
        loadSavedAISummary({ content: event.data.payload?.content ?? '', savedPath: event.data.payload?.savedPath ?? null, provider: event.data.payload?.provider ?? null });
        return;
      }
      if (event.data.type === 'AI_SUMMARY_DONE') {
        completeAISummary({ content: event.data.payload?.content, savedPath: event.data.payload?.savedPath ?? null, provider: event.data.payload?.provider ?? null });
        return;
      }
      if (event.data.type === 'AI_SUMMARY_ERROR') {
        failAISummary(event.data.payload?.message);
        return;
      }
      if (event.data.type === 'AI_QA_CHUNK') {
        setQAStreamingResponse((current) => `${current}${event.data.payload?.chunk ?? ''}`);
        return;
      }
      if (event.data.type === 'AI_QA_COMPLETE') {
        setQAStreamingResponse('');
        completeAIQA({ appendedContent: event.data.payload?.appendedContent ?? '' });
        return;
      }
      if (event.data.type === 'AI_QA_ERROR') {
        setQAStreamingResponse('');
        failAIQA(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [appendAISummaryChunk, completeAIQA, completeAISummary, failAIQA, failAISummary, hasCurrentSavedSummary, loadSavedAISummary, setAISummarySettings, setSummaryTokenWarning, startAISummaryGeneration]);

  useEffect(() => {
    if (!isActive || !hasLoadedSettings || !canStartSummary || currentSummaryContent || isLoadingSummary || isGeneratingSummary || summaryError) return;
    if (!isVSCodeRuntime() && summaryMode === 'file' && selectedFile?.hasSavedSummary) {
      loadSavedAISummary({
        content: DEMO_SUMMARY,
        savedPath: `${savePath}/${toDemoCommitDirName(selectedCommit?.shortHash ?? '', selectedCommit?.message ?? '')}/${selectedFile.path.replace(/[\\/]/g, '__')}.md`,
        provider: activeAIProvider,
      });
      return;
    }
    startSummary(false);
  }, [activeAIProvider, canStartSummary, currentSummaryContent, hasLoadedSettings, isActive, isGeneratingSummary, isLoadingSummary, loadSavedAISummary, savePath, selectedCommit?.shortHash, selectedFile, startSummary, summaryError, summaryMode]);

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
    selectedFile,
    setIsDialogOpen,
    setIsTokenWarningDismissed,
    qaError,
    qaStreamingResponse,
    summaryError,
    summaryMode,
    summarySavedPath,
  };
}

function toDemoCommitDirName(shortHash: string, commitMessage: string): string {
  const sanitized = commitMessage.replace(/[^A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, '').replace(/\s+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return `${shortHash}_${sanitized || 'commit'}`;
}

function streamDemoSummary(options: StreamDemoSummaryOptions): void {
  let index = 0;
  const summary = options.summaryMode === 'commit' ? DEMO_COMMIT_SUMMARY : DEMO_SUMMARY;
  const content = options.forceRegenerate ? `${summary}\n` : summary;
  const commitDirName = toDemoCommitDirName(options.commitHash, options.commitMessage);
  const timer = window.setInterval(() => {
    const next = content.slice(index, index + 8);
    index += next.length;
    options.appendChunk(next);
    if (index >= content.length) {
      window.clearInterval(timer);
      options.complete({
        content,
        savedPath: options.summaryMode === 'commit' ? `.git-author/${commitDirName}/전체_파일_정리.md` : `.git-author/${commitDirName}/${options.filePath?.replace(/[\\/]/g, '__') ?? 'summary'}.md`,
        provider: 'claude',
      });
    }
  }, 24);
}

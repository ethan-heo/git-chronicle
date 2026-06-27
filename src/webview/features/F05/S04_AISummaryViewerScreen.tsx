import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { TopHeader } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import type { AIProviderName } from '../../types/commit';
import { AISummaryViewer } from './AISummaryViewer';
import { OverwriteConfirmDialog } from './OverwriteConfirmDialog';
import { TokenLimitWarning } from './TokenLimitWarning';

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

export const S04AISummaryViewerScreen: FC = () => {
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const summaryMode = useAppStore((state) => state.summaryMode);
  const savePath = useAppStore((state) => state.savePath);
  const activeAIProvider = useAppStore((state) => state.activeAIProvider);
  const currentSummaryContent = useAppStore((state) => state.currentSummaryContent);
  const isLoadingSummary = useAppStore((state) => state.isLoadingSummary);
  const isGeneratingSummary = useAppStore((state) => state.isGeneratingSummary);
  const summaryError = useAppStore((state) => state.summaryError);
  const summarySavedPath = useAppStore((state) => state.summarySavedPath);
  const hasCurrentSavedSummary = useAppStore((state) => state.hasCurrentSavedSummary);
  const isSummaryTokenLimitExceeded = useAppStore((state) => state.isSummaryTokenLimitExceeded);
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const setAISummarySettings = useAppStore((state) => state.setAISummarySettings);
  const startAISummaryLoading = useAppStore((state) => state.startAISummaryLoading);
  const startAISummaryGeneration = useAppStore((state) => state.startAISummaryGeneration);
  const appendAISummaryChunk = useAppStore((state) => state.appendAISummaryChunk);
  const completeAISummary = useAppStore((state) => state.completeAISummary);
  const loadSavedAISummary = useAppStore((state) => state.loadSavedAISummary);
  const failAISummary = useAppStore((state) => state.failAISummary);
  const setSummaryTokenWarning = useAppStore((state) => state.setSummaryTokenWarning);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTokenWarningDismissed, setIsTokenWarningDismissed] = useState(false);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(!isVSCodeRuntime());

  const canStartFileSummary = summaryMode === 'file' && Boolean(selectedCommit && selectedFile && activeAIProvider && savePath);

  const headerContext = useMemo(() => {
    if (!selectedCommit) {
      return '준비 중';
    }

    if (summaryMode === 'commit') {
      return '커밋 전체 요약';
    }

    return selectedFile?.path ?? '파일 선택 없음';
  }, [selectedCommit, selectedFile, summaryMode]);

  const startSummary = useCallback(
    (forceRegenerate = false): void => {
      if (!selectedCommit || !selectedFile || !activeAIProvider || !savePath || summaryMode !== 'file') {
        return;
      }

      setSummaryTokenWarning(false);
      setIsTokenWarningDismissed(false);

      if (!isVSCodeRuntime()) {
        startAISummaryGeneration();
        streamDemoSummary(forceRegenerate, appendAISummaryChunk, completeAISummary);
        return;
      }

      startAISummaryLoading();
      postMessage('START_AI_SUMMARY_FILE', {
        commitHash: selectedCommit.hash,
        filePath: selectedFile.path,
        provider: activeAIProvider,
        savePath,
        forceRegenerate,
      });
    },
    [
      activeAIProvider,
      appendAISummaryChunk,
      completeAISummary,
      savePath,
      selectedCommit,
      selectedFile,
      setSummaryTokenWarning,
      startAISummaryGeneration,
      startAISummaryLoading,
      summaryMode,
    ],
  );

  useEffect(() => {
    if (!isVSCodeRuntime()) {
      return;
    }

    postMessage('FETCH_AI_SUMMARY_SETTINGS');
  }, []);

  useEffect(() => {
    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          activeAIProvider?: AIProviderName | null;
          savePath?: string | null;
          isOverLimit?: boolean;
          chunk?: string;
          content?: string;
          savedPath?: string | null;
          provider?: AIProviderName | null;
          message?: string;
        };
      }>,
    ): void => {
      if (event.data.type === 'AI_SUMMARY_SETTINGS_LOADED') {
        setAISummarySettings({
          savePath: event.data.payload?.savePath ?? null,
          activeAIProvider: event.data.payload?.activeAIProvider ?? null,
        });
        setHasLoadedSettings(true);
        return;
      }

      if (event.data.type === 'AI_SUMMARY_STARTED') {
        startAISummaryGeneration();
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
        loadSavedAISummary({
          content: event.data.payload?.content ?? '',
          savedPath: event.data.payload?.savedPath ?? null,
          provider: event.data.payload?.provider ?? null,
        });
        return;
      }

      if (event.data.type === 'AI_SUMMARY_DONE') {
        completeAISummary({
          content: event.data.payload?.content,
          savedPath: event.data.payload?.savedPath ?? null,
          provider: event.data.payload?.provider ?? null,
        });
        return;
      }

      if (event.data.type === 'AI_SUMMARY_ERROR') {
        failAISummary(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [appendAISummaryChunk, completeAISummary, failAISummary, loadSavedAISummary, setAISummarySettings, setSummaryTokenWarning, startAISummaryGeneration]);

  useEffect(() => {
    if (!hasLoadedSettings || !canStartFileSummary || currentSummaryContent || isLoadingSummary || isGeneratingSummary || summaryError) {
      return;
    }

    if (!isVSCodeRuntime() && selectedFile?.hasSavedSummary) {
      loadSavedAISummary({
        content: DEMO_SUMMARY,
        savedPath: `${savePath}/${selectedCommit?.shortHash}/${selectedFile.path.replace(/[\\/]/g, '__')}.md`,
        provider: activeAIProvider,
      });
      return;
    }

    startSummary(false);
  }, [
    activeAIProvider,
    canStartFileSummary,
    currentSummaryContent,
    hasLoadedSettings,
    isLoadingSummary,
    isGeneratingSummary,
    loadSavedAISummary,
    savePath,
    selectedCommit?.shortHash,
    selectedFile,
    startSummary,
    summaryError,
  ]);

  if (!selectedCommit || (summaryMode === 'file' && !selectedFile)) {
    return null;
  }

  return (
    <main className="app-shell commit-log-shell ai-summary-shell">
      <TopHeader title={selectedCommit.message} context={headerContext} showBackButton onBackClick={goBackFromDetail} showSettingsIcon onSettingsClick={goToSettingsView} />
      <section className="ai-summary-screen">
        <TokenLimitWarning isVisible={isSummaryTokenLimitExceeded && !isTokenWarningDismissed} onDismiss={() => setIsTokenWarningDismissed(true)} />
        <AISummaryViewer
          content={currentSummaryContent}
          error={summaryError}
          isLoading={!hasLoadedSettings || isLoadingSummary}
          isGenerating={isGeneratingSummary}
          hasSavedSummary={hasCurrentSavedSummary}
          hasAIProvider={Boolean(activeAIProvider)}
          hasSavePath={Boolean(savePath)}
          savedPath={summarySavedPath}
          providerLabel={activeAIProvider}
          summaryMode={summaryMode}
          onGoToSettings={goToSettingsView}
          onRegenerate={() => setIsDialogOpen(true)}
          onRetry={() => startSummary(true)}
        />
      </section>
      <OverwriteConfirmDialog
        isOpen={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={() => {
          setIsDialogOpen(false);
          startSummary(true);
        }}
      />
    </main>
  );
};

function streamDemoSummary(
  forceRegenerate: boolean,
  appendChunk: (chunk: string) => void,
  complete: (payload: { content?: string; savedPath?: string | null; provider?: AIProviderName | null }) => void,
): void {
  let index = 0;
  const content = forceRegenerate ? `${DEMO_SUMMARY}\n` : DEMO_SUMMARY;
  const timer = window.setInterval(() => {
    const next = content.slice(index, index + 8);
    index += next.length;
    appendChunk(next);

    if (index >= content.length) {
      window.clearInterval(timer);
      complete({
        content,
        savedPath: '.git-author/a1b2c3d/src__components__CommitList__useInfiniteScroll.ts.md',
        provider: 'claude',
      });
    }
  }, 24);
}

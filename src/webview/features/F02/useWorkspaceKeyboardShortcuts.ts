import { useEffect, useRef } from 'react';
import { isVSCodeRuntime } from '../../bridge/vscodeApi';
import { useAppStore } from '../../store/appStore';
import { findLeafPane, getActiveTab } from '../../store/slices/workspaceTabsSlice';

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) || /Mac/i.test(navigator.platform);
}

export function useWorkspaceKeyboardShortcuts(): void {
  const paneTree = useAppStore((state) => state.paneTree);
  const focusedPaneId = useAppStore((state) => state.focusedPaneId);
  const closeWorkspaceTab = useAppStore((state) => state.closeWorkspaceTab);
  const activateAdjacentWorkspaceTab = useAppStore((state) => state.activateAdjacentWorkspaceTab);
  const paneTreeRef = useRef(paneTree);
  const focusedPaneIdRef = useRef(focusedPaneId);
  const closeWorkspaceTabRef = useRef(closeWorkspaceTab);
  const activateAdjacentWorkspaceTabRef = useRef(activateAdjacentWorkspaceTab);
  const isMacRef = useRef(isMacPlatform());

  useEffect(() => {
    paneTreeRef.current = paneTree;
    focusedPaneIdRef.current = focusedPaneId;
    closeWorkspaceTabRef.current = closeWorkspaceTab;
    activateAdjacentWorkspaceTabRef.current = activateAdjacentWorkspaceTab;
  }, [activateAdjacentWorkspaceTab, closeWorkspaceTab, focusedPaneId, paneTree]);

  useEffect(() => {
    const closeActivePaneTab = (): void => {
      const pane = findLeafPane(paneTreeRef.current, focusedPaneIdRef.current);
      const activeTab = pane ? getActiveTab(pane) : null;
      if (!pane || !activeTab) {
        return;
      }

      closeWorkspaceTabRef.current(pane.paneId, activeTab.id);
    };

    // VS Code는 "에디터 닫기" 같은 워크벤치 키바인딩을 웹뷰의 preventDefault()와 무관하게
    // 항상 호스트로 전달한다. 그래서 Ctrl/Cmd+W는 package.json의 activeWebviewPanelId when절
    // 키바인딩으로 gitChronicle.closeActiveTab 커맨드로 라우팅되고, 그 커맨드가 보낸
    // CLOSE_ACTIVE_TAB 메시지를 받아 처리한다. VS Code 안에서는 이 메시지 경로만 신뢰해야 한다 —
    // 웹뷰 iframe에서도 동일한 keydown이 그대로 발생하므로, 아래 keydown 경로까지 같이
    // closeActivePaneTab을 호출하면 메시지가 도착할 때쯤 이미 다음 활성 탭으로 넘어가 있어
    // 그 탭까지 이중으로 닫힌다. keydown 경로는 VS Code 밖(브라우저 미리보기) 런타임 전용이다.
    const handleMessage = (event: MessageEvent<{ type: string }>): void => {
      if (event.data?.type === 'CLOSE_ACTIVE_TAB') {
        closeActivePaneTab();
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      const isMac = isMacRef.current;
      const isCloseShortcut = (isMac ? event.metaKey : event.ctrlKey) && (event.key === 'w' || event.key === 'W');
      const isTabSwitchShortcut = !isMac && event.ctrlKey && event.key === 'Tab';

      if (event.altKey || (!isCloseShortcut && !isTabSwitchShortcut)) {
        return;
      }

      if (isCloseShortcut) {
        event.preventDefault();
        if (!isVSCodeRuntime()) {
          closeActivePaneTab();
        }
        return;
      }

      event.preventDefault();
      activateAdjacentWorkspaceTabRef.current(focusedPaneIdRef.current, event.shiftKey ? 'prev' : 'next');
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

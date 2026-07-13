import { useEffect, useRef } from 'react';
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
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isMac = isMacRef.current;
      const isCloseShortcut = (isMac ? event.metaKey : event.ctrlKey) && (event.key === 'w' || event.key === 'W');
      const isTabSwitchShortcut = !isMac && event.ctrlKey && event.key === 'Tab';

      if (event.altKey || (!isCloseShortcut && !isTabSwitchShortcut)) {
        return;
      }

      if (isCloseShortcut) {
        event.preventDefault();
        const pane = findLeafPane(paneTreeRef.current, focusedPaneIdRef.current);
        const activeTab = pane ? getActiveTab(pane) : null;
        if (!pane || !activeTab) {
          return;
        }

        closeWorkspaceTabRef.current(pane.paneId, activeTab.id);
        return;
      }

      event.preventDefault();
      activateAdjacentWorkspaceTabRef.current(focusedPaneIdRef.current, event.shiftKey ? 'prev' : 'next');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

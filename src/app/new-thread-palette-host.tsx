import { NewThreadPalette } from '@/packages/core-ui/new-thread-palette';
import { useSidebarStore } from '@/packages/core-ui/sidebar-store';
import type { AgentAccountsRequest } from '@/packages/shared/agent-accounts';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { getActiveSidebarProject, subscribeActiveSidebarProject } from '../sidebar-runtime/active-project-store';
import { createSidebarGroupId } from '../sidebar-runtime/sidebar-ids';
import type { WebSidebarRuntime } from '../sidebar-runtime/sidebar-runtime';

/**
 * CDXC:AgentLauncher 2026-09-09 DECISION:
 * User: the desktop app draws the New Thread picker natively in GPUI, but the
 * web app keeps the shared React palette because it is React-based. It reads
 * the same store the sidebar hydrates, lists accounts from the active
 * project's machine, and hides the Browser row because the web has no
 * Browser pane.
 */
export function NewThreadPaletteHost({ runtime }: { runtime: WebSidebarRuntime }) {
  const agents = useSidebarStore((state) => state.hud.agents);
  const [isOpen, setIsOpen] = useState(false);
  const [openRequestSequence, setOpenRequestSequence] = useState(0);
  const activeProject = useSyncExternalStore(
    subscribeActiveSidebarProject,
    getActiveSidebarProject,
    getActiveSidebarProject
  );
  const transport = useMemo(() => {
    const requestGroupAccounts = runtime.vscode.requestGroupAccounts;
    if (!activeProject || !requestGroupAccounts) {
      return undefined;
    }
    const groupId = createSidebarGroupId(activeProject.machineId, activeProject.projectId);
    return (request: AgentAccountsRequest) => requestGroupAccounts(groupId, request);
  }, [runtime, activeProject]);

  useEffect(() => {
    const open = () => {
      setOpenRequestSequence((sequence) => sequence + 1);
      setIsOpen(true);
    };
    const close = () => setIsOpen(false);
    window.addEventListener('ghostex-web:openNewThreadPalette', open);
    window.addEventListener('ghostex-web:closeAppModal', close);
    return () => {
      window.removeEventListener('ghostex-web:openNewThreadPalette', open);
      window.removeEventListener('ghostex-web:closeAppModal', close);
    };
  }, []);

  return (
    <NewThreadPalette
      agents={agents}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsOpen(false);
        }
      }}
      openRequestSequence={openRequestSequence}
      showBrowser={false}
      transport={transport}
      vscode={runtime.vscode}
    />
  );
}

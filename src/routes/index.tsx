import { createFileRoute } from '@tanstack/react-router';
import { IntegratedAgentsPage } from '../app/agents-page';
import { AgentsWorkspace } from '../workspace/agents-workspace';
import { createMockWorkspaceSessions } from '../workspace/mock-workspace';
import { AsyncQuestionsDebug } from '../workspace/async-questions-debug';

function AgentsPage() {
  if (
    (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true &&
    new URLSearchParams(window.location.search).get('asyncQuestionsDebug') === '1'
  ) {
    return <AsyncQuestionsDebug />;
  }
  const debugSeed =
    (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true &&
    new URLSearchParams(window.location.search).get('workspaceDebug') === '1';
  return debugSeed ? <AgentsWorkspace debugSeed sessions={createMockWorkspaceSessions()} /> : <IntegratedAgentsPage />;
}

export const Route = createFileRoute('/')({
  component: AgentsPage,
});

import { useMemo, useState } from 'react';
import { SessionChatView } from '@/packages/core-ui/chat/session-chat-view';
import type { SessionChatTransport } from '@/packages/core-ui/chat/session-chat-transport';
import type {
  GxserverReadSessionChatResult,
  GxserverSessionChatEvent,
  SessionChatMessage,
} from '@/packages/shared/session-chat';
import '@/packages/core-ui/styles.css';
import { AgentsWorkspace } from './agents-workspace';
import type { WorkspaceSession } from './workspace-model';

function createSimulation(generation: number, onSend: (text: string) => void, onFailure: () => void) {
  const listeners = new Set<(event: GxserverSessionChatEvent) => void>();
  let seq = 1;
  let failNext = false;
  const messages: SessionChatMessage[] = [
    {
      id: 'simulation-user',
      role: 'user',
      blocks: [{ type: 'text', text: 'Implement the settings page. Ask me about choices while you continue working.' }],
      timestamp: Date.now() - 30000,
      source: 'transcript',
    },
    {
      id: 'simulation-questions',
      role: 'assistant',
      blocks: [{ type: 'text', text: 'I am building the layout. A few preferences will help me finish the details.' }],
      asyncQuestions: [
        {
          title: 'Which theme should the settings page use?',
          options: ['Dark (Recommended)', 'Light', 'Follow system'],
        },
        { title: 'How should settings changes be saved?', options: ['Save automatically', 'Use a Save button'] },
        { title: 'What should the heading above the settings be?' },
      ],
      timestamp: Date.now() - 20000,
      source: 'transcript',
    },
    {
      id: 'simulation-progress',
      role: 'assistant',
      blocks: [
        { type: 'text', text: 'The base layout is ready. I am continuing with keyboard navigation while you choose.' },
      ],
      timestamp: Date.now() - 10000,
      source: 'transcript',
    },
  ];
  const read = (): GxserverReadSessionChatResult => ({
    messages: [...messages],
    status: 'working',
    working: true,
    agent: 'codex',
    agentSessionId: `codex-async-question-simulation-${generation}`,
    screenProbed: true,
    selectedOptions: { model: { label: 'GPT-6', value: 'gpt-6' }, detectedAt: new Date().toISOString() },
    hasMore: false,
    beforeOffset: 0,
    epoch: 1,
    seq,
  });
  const append = (role: SessionChatMessage['role'], text: string) => {
    const message: SessionChatMessage = {
      id: `simulation-event-${++seq}`,
      role,
      blocks: [{ type: 'text', text }],
      timestamp: Date.now(),
      source: 'transcript',
    };
    messages.push(message);
    for (const onEvent of listeners) {
      onEvent({
        type: 'sessionChatAppended',
        protocolVersion: 1,
        serverId: 'async-question-simulation',
        projectId: 'async-question-simulation',
        sessionId: 'simulation',
        epoch: 1,
        seq,
        messages: [message],
      });
    }
  };
  const transport: SessionChatTransport = {
    read: async () => read(),
    subscribe: ({ onEvent }) => {
      listeners.add(onEvent);
      return () => listeners.delete(onEvent);
    },
    send: async (text) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (failNext) {
        failNext = false;
        onFailure();
        throw new Error('Simulated connection failure. Your answer has not been sent.');
      }
      onSend(text);
      append('user', text);
    },
    answerPrompt: async () => {},
    interrupt: async () => {},
  };
  return {
    transport,
    failNext: () => {
      failNext = true;
    },
    progress: () =>
      append('assistant', 'Keyboard navigation is now wired. I am checking the remaining settings controls.'),
  };
}

/** Development-only browser simulation, selected by ?asyncQuestionsDebug=1. */
export function AsyncQuestionsDebug() {
  const [generation, setGeneration] = useState(1);
  const [narrow, setNarrow] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [lightTheme, setLightTheme] = useState(false);
  const [shortPane, setShortPane] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const [failureArmed, setFailureArmed] = useState(false);
  const simulation = useMemo(
    () =>
      createSimulation(
        generation,
        (text) => setSent((current) => [...current, text]),
        () => setFailureArmed(false)
      ),
    [generation]
  );
  const sessions = useMemo<WorkspaceSession[]>(
    () => [
      {
        machineId: `async-question-simulation-${generation}`,
        projectId: 'async-question-simulation',
        sessionId: 'simulation',
        title: 'Codex async questions simulation',
        agentId: 'codex',
        agentIcon: 'codex',
        activity: 'working',
        presentationState: 'running',
        sessionSurfaceMode: 'chat',
      },
    ],
    [generation]
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: '#161616',
        color: '#eee',
      }}
    >
      <div
        aria-label='Simulation controls'
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, fontSize: 12 }}
      >
        <button
          type='button'
          onClick={() => {
            setGeneration(Date.now());
            setSent([]);
            setFailureArmed(false);
          }}
        >
          Reset simulation
        </button>
        <button type='button' onClick={() => simulation.progress()}>
          Append working progress
        </button>
        <button
          type='button'
          aria-pressed={failureArmed}
          onClick={() => {
            simulation.failNext();
            setFailureArmed(true);
          }}
        >
          Fail next send
        </button>
        <button type='button' aria-pressed={narrow} onClick={() => setNarrow((value) => !value)}>
          390px chat width
        </button>
        <button type='button' aria-pressed={readOnly} onClick={() => setReadOnly((value) => !value)}>
          Read-only session
        </button>
        <button type='button' aria-pressed={lightTheme} onClick={() => setLightTheme((value) => !value)}>
          Light chat theme
        </button>
        <button type='button' aria-pressed={shortPane} onClick={() => setShortPane((value) => !value)}>
          500px chat height
        </button>
        <span role='status'>Simulation: working · Sent messages: {sent.length}</span>
      </div>
      <div
        style={{
          flex: shortPane ? '0 0 500px' : 1,
          minHeight: 0,
          width: narrow ? 390 : '100%',
          maxWidth: '100%',
          alignSelf: 'center',
        }}
      >
        <AgentsWorkspace
          key={generation}
          primaryMachineId={sessions[0].machineId}
          sessions={sessions}
          renderChatBody={() => (
            <SessionChatView
              agentLabel='codex'
              canSend={!readOnly}
              className='workspace-session-chat'
              inputBackend='lexical'
              sessionKey={`async-question-simulation-${generation}`}
              sessionTitle='Codex async questions simulation'
              theme={lightTheme ? 'light' : 'dark'}
              transport={simulation.transport}
              working
            />
          )}
        />
      </div>
      {sent.length > 0 && (
        <pre
          aria-label='Sent simulation messages'
          style={{ fontSize: 11, maxHeight: 100, overflow: 'auto', padding: 8, whiteSpace: 'pre-wrap' }}
        >
          {sent.join('\n\n')}
        </pre>
      )}
    </div>
  );
}

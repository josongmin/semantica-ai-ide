import React, { useEffect, useRef } from "react";
import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from "jotai";

import { useFeatureBootstrap } from "./useFeatureBootstrap";

import { ChatPage } from "~domains/chat/pages";

const ArenaPage = React.lazy(() =>
  import("~domains/chat/pages/arena").then((m) => ({ default: m.ArenaPage })),
);
const ReviewPage = React.lazy(() =>
  import("~domains/review/pages/review").then((m) => ({ default: m.ReviewPage })),
);
const SessionListPage = React.lazy(() =>
  import("~domains/chat/pages/sessions").then((m) => ({ default: m.SessionListPage })),
);
const SettingsPage = React.lazy(() =>
  import("~domains/settings/pages/settings").then((m) => ({ default: m.SettingsPage })),
);
const TodoBoardPage = React.lazy(() =>
  import("~domains/tasks/pages/todo-board").then((m) => ({ default: m.TodoBoardPage })),
);
import { currentPageAtom, logger, openTabsAtom, useKeyboardScopeSync } from "../shared/lib";
import { ErrorBoundary, Spinner } from "../shared/ui";
import { SurfaceRouter } from "../surfaces";
import { KeyboardShortcutsDialog } from "../widgets/keyboard-shortcuts";
import { SessionSwitcher } from "../widgets/session-switcher";
import { SessionTabBar } from "../widgets/session-tab-bar";
import { TurnTableOfContents } from "../widgets/turn-toc";
import { initAppMenu } from "./menu";
import {
  activeSurfaceAtom,
  ShellLayout,
  useIntentRouter,
  useLayoutPersistence,
  useShellKeyboard,
} from "./shell";

import { DEMO_DEFAULT_FILE, DEMO_FILES } from "~domains/editor/demoFiles";
import { editorTabsAtom, openFileInEditorAtom } from "~domains/editor/editorAtoms";

/**
 * Streaming bootstrap — activates the postMessage -> Jotai bridge,
 * registers all features via the feature registry (OCP), and
 * restores the active session from VSCode state on mount.
 */
function StreamingBootstrap({ children }: { children: React.ReactNode }) {
  useFeatureBootstrap();

  // Shell UX: keyboard chords, layout persistence, intent-driven routing
  useKeyboardScopeSync(); // Sync overlay stack → keyboard scope dispatcher
  useShellKeyboard();
  useLayoutPersistence();
  useIntentRouter();

  // Native menu bar (Tauri) / no-op (browser)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const store = getDefaultStore();
    initAppMenu(store)
      .then((c) => {
        cleanup = c;
      })
      .catch((err: unknown) => logger.error("[App] Menu init failed:", err));
    return () => cleanup?.();
  }, []);

  return <>{children}</>;
}

/**
 * Agent panel content — Chat + session pages.
 * Lives in the right-side agent panel of the 3-column layout.
 * ChatPage stays mounted so scroll position and context are preserved.
 */
function AgentContent() {
  const [page] = useAtom(currentPageAtom);
  const tabs = useAtomValue(openTabsAtom);
  const isChat = page === "chat";
  const hasTabs = tabs.length > 0;

  return (
    <div className="flex flex-col h-full">
      {hasTabs && <SessionTabBar />}

      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1 min-w-0 relative flex flex-col">
          <div
            className="h-full overflow-hidden flex-col"
            style={{ display: isChat ? "flex" : "none" }}
            aria-hidden={!isChat}
          >
            <ChatPage />
          </div>
          {!isChat && (
            <div className="absolute inset-0 z-[--z-overlay] flex flex-col overflow-hidden w-full min-w-0">
              <ErrorBoundary>
                <React.Suspense fallback={<PageSpinner />}>
                  {page === "sessions" && <SessionListPage />}
                  {page === "todos" && <TodoBoardPage />}
                  {page === "arena" && <ArenaPage />}
                  {page === "review" && <ReviewPage />}
                  {page === "settings" && <SettingsPage />}
                </React.Suspense>
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Centered spinner used as Suspense fallback for lazy-loaded pages */
function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="md" />
    </div>
  );
}

/**
 * IDE center content router (RFC-009).
 * Default shows editor with Monaco. Other surfaces route via SurfaceRouter.
 * "chat" surface maps to editor since chat lives in the agent panel.
 */
function IDEContent() {
  const surface = useAtomValue(activeSurfaceAtom);
  const effectiveSurface = surface === "chat" ? "editor" : surface;

  if (effectiveSurface === "editor") {
    return <EditorBootstrap />;
  }

  return <SurfaceRouter />;
}

/**
 * Editor surface with demo file bootstrap.
 * Seeds demo files on first mount so the IDE shows real code immediately.
 */
const LazyEditorSurface = React.lazy(() =>
  import("~domains/editor").then((m) => ({ default: m.EditorSurface })),
);

function EditorBootstrap() {
  const tabs = useAtomValue(editorTabsAtom);
  const openFile = useSetAtom(openFileInEditorAtom);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || tabs.length > 0) return;
    seeded.current = true;

    for (const [path, content] of Object.entries(DEMO_FILES)) {
      openFile(path, content);
    }
    openFile(DEMO_DEFAULT_FILE, DEMO_FILES[DEMO_DEFAULT_FILE]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <React.Suspense fallback={<PageSpinner />}>
      <LazyEditorSurface />
    </React.Suspense>
  );
}

/**
 * Root application component.
 *
 * Architecture (RFC-002 + RFC-009 + RFC-015):
 * ShellLayout provides the 5-zone IDE shell:
 *   Sidebar (left) | IDE surfaces (center) | AI Agent chat (right)
 * Global overlays (ToC, session switcher, shortcuts dialog) float above everything.
 */
export const App = React.memo(function App() {
  return (
    <ErrorBoundary>
      <StreamingBootstrap>
        <ShellLayout agentContent={<AgentContent />}>
          <IDEContent />
        </ShellLayout>
        {/* Global overlays */}
        <TurnTableOfContents />
        <SessionSwitcher />
        <KeyboardShortcutsDialog />
      </StreamingBootstrap>
    </ErrorBoundary>
  );
});

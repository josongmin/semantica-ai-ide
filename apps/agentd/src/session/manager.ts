import type { EventId, SessionId } from "@semantica/protocol";

/**
 * Session Manager — SSOT for session state.
 * Currently in-memory, will be backed by SQLite in Phase 3.
 */

interface SessionState {
  readonly id: SessionId;
  readonly created_at: string;
  readonly turns: unknown[];
  readonly lastEventId: EventId | null;
}

class SessionManager {
  private sessions = new Map<SessionId, SessionState>();
  private activeSessionId: SessionId | null = null;

  /** Get or create the active session */
  getOrCreateSession(): SessionId {
    if (this.activeSessionId && this.sessions.has(this.activeSessionId)) {
      return this.activeSessionId;
    }

    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as SessionId;
    const session: SessionState = {
      id,
      created_at: new Date().toISOString(),
      turns: [],
      lastEventId: null,
    };

    this.sessions.set(id, session);
    this.activeSessionId = id;
    return id;
  }

  /** Check if we can resume from a given event_id (session-scoped) */
  canResume(sessionId: SessionId, _lastEventId: EventId): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    // TODO: Check event log to determine if patch is possible
    // For now, always use snapshot
    return false;
  }

  /** Get full state snapshot for a session */
  getSnapshot(sessionId: SessionId): unknown {
    const session = this.sessions.get(sessionId);
    if (!session) return {};
    return {
      session_id: session.id,
      created_at: session.created_at,
      turns: session.turns,
    };
  }
}

export const sessionManager = new SessionManager();

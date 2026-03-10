import type { ApprovalMode, SessionId, TurnId } from "../../../shared/protocol";
import { nextId } from "./MockBackendCore";

export interface MockSessionState {
  sessionId: SessionId;
  turnIds: TurnId[];
  approvalMode: ApprovalMode;
  activeModel: string;
  thinkingMode: boolean;
  fastMode: boolean;
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  turnCounter: number;
}

export function createMockSessionState(): MockSessionState {
  return {
    sessionId: nextId("session") as SessionId,
    turnIds: [],
    approvalMode: "auto",
    activeModel: "claude-opus-4-6",
    thinkingMode: true,
    fastMode: false,
    costUsd: 0,
    tokensIn: 0,
    tokensOut: 0,
    turnCounter: 0,
  };
}

export function addCost(state: MockSessionState, cost: number, tokIn: number, tokOut: number): void {
  state.costUsd += cost;
  state.tokensIn += tokIn;
  state.tokensOut += tokOut;
}

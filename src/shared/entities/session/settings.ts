/**
 * Session / settings — configuration and preference atoms.
 *
 * Prefer this narrower import when you only need approval-mode or other
 * session-level settings:
 *
 *   import { approvalModeAtom } from "@entities/session/settings";
 *
 * The root barrel (`@entities/session`) still re-exports everything for
 * backward compatibility.
 */

export { approvalModeAtom } from "./model/atoms";
export type { ApprovalMode } from "./model/types";

/**
 * Handler barrel — importing this module triggers all handler registrations
 * via side-effect imports.  No explicit setup calls are needed.
 *
 * The deprecated setupXxx() functions are still re-exported for backward
 * compatibility but are now no-ops (handlers register at module scope).
 */

// Side-effect imports — each module self-registers its handlers on import
import "./entityHandlers";
import "./featureHandlers";
import "./uiHandlers";

// Re-export deprecated setup functions for backward compatibility
/* eslint-disable @typescript-eslint/no-deprecated -- barrel re-exports kept for backward compatibility */
export { setupDiffHandlers } from "./diffHandlers";
export { setupEntityHandlers } from "./entityHandlers";
export { setupFeatureHandlers } from "./featureHandlers";
export { setupMcpHandlers } from "./mcpHandlers";
export { setupMessageHandlers } from "./messageHandlers";
export { setupPipelineHandlers } from "./pipelineHandlers";
export { setupSessionHandlers } from "./sessionHandlers";
export { setupToolCallHandlers } from "./toolCallHandlers";
export { setupUiHandlers } from "./uiHandlers";
/* eslint-enable @typescript-eslint/no-deprecated */

// Active exports
export type { EventHandler, Store } from "./types";
export { getHandler, registerHandler } from "./types";

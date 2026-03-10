// Types
export type {
  QueryContext,
  QueryIntent,
  QueryJob,
  LspSessionManager,
  QueryGateway,
  ResultNormalizer,
  EventHandler,
  EventBridge,
  PolicyOutcome,
  PolicyQuery,
  PolicyResult,
  CapabilityTranslator,
  IntegrationKernel,
} from "./types.js";

// Factory
export type { KernelTransport } from "./factory.js";
export { createKernel } from "./factory.js";

// Implementation (for advanced usage / testing)
export { IntegrationKernelImpl } from "./IntegrationKernel.js";
export { LspSessionManagerImpl } from "./adapters/LspSessionManagerImpl.js";
export { QueryGatewayImpl } from "./adapters/QueryGatewayImpl.js";
export { ResultNormalizerImpl } from "./adapters/ResultNormalizerImpl.js";
export { EventBridgeImpl } from "./adapters/EventBridgeImpl.js";
export { CapabilityTranslatorImpl } from "./adapters/CapabilityTranslatorImpl.js";

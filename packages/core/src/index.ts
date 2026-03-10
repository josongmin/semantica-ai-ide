export type { Transport, TransportState, WsTransportOptions } from "./transport.js";
export { WsTransport } from "./transport.js";

// Platform detection
export type { PlatformKind } from "./platform.js";
export { detectPlatform } from "./platform.js";

// Platform-specific transports
export { VscodeTransport } from "./transports/VscodeTransport.js";
export { TauriTransport } from "./transports/TauriTransport.js";

import type {
  CapabilityTranslator,
  EventBridge,
  IntegrationKernel,
  LspSessionManager,
  QueryGateway,
  ResultNormalizer,
} from "./types.js";
import type { KernelTransport } from "./factory.js";
import { LspSessionManagerImpl } from "./adapters/LspSessionManagerImpl.js";
import { QueryGatewayImpl } from "./adapters/QueryGatewayImpl.js";
import { ResultNormalizerImpl } from "./adapters/ResultNormalizerImpl.js";
import { EventBridgeImpl } from "./adapters/EventBridgeImpl.js";
import { CapabilityTranslatorImpl } from "./adapters/CapabilityTranslatorImpl.js";

export class IntegrationKernelImpl implements IntegrationKernel {
  readonly lsp: LspSessionManager;
  readonly query: QueryGateway;
  readonly normalizer: ResultNormalizer;
  readonly events: EventBridge;
  readonly policy: CapabilityTranslator;

  private readonly transport: KernelTransport;
  private readonly disposers: Array<() => void> = [];
  private initialized = false;

  constructor(transport: KernelTransport) {
    this.transport = transport;
    this.lsp = new LspSessionManagerImpl(transport);
    this.query = new QueryGatewayImpl(transport);
    this.normalizer = new ResultNormalizerImpl();
    this.events = new EventBridgeImpl();
    this.policy = new CapabilityTranslatorImpl(transport);

    // Bridge transport events into the EventBridge
    const unsubscribe = this.transport.on("event", (data) => {
      this.events.emit(data);
    });
    this.disposers.push(unsubscribe);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.transport.send("kernel/initialize", {});
    this.initialized = true;
  }

  dispose(): void {
    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers.length = 0;
    this.initialized = false;
  }
}

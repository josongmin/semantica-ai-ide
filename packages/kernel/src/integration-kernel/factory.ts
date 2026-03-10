import type { IntegrationKernel } from "./types.js";
import { IntegrationKernelImpl } from "./IntegrationKernel.js";

export interface KernelTransport {
  send(channel: string, data: unknown): Promise<void>;
  on(channel: string, handler: (data: unknown) => void): () => void;
}

export function createKernel(transport: KernelTransport): IntegrationKernel {
  return new IntegrationKernelImpl(transport);
}

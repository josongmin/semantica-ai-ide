import type { LspSessionManager } from "../types.js";
import type { KernelTransport } from "../factory.js";

export class LspSessionManagerImpl implements LspSessionManager {
  private readonly openDocuments = new Set<string>();

  constructor(private readonly transport: KernelTransport) {}

  async openDocument(uri: string): Promise<void> {
    this.openDocuments.add(uri);
    await this.transport.send("lsp/openDocument", { uri });
  }

  async closeDocument(uri: string): Promise<void> {
    this.openDocuments.delete(uri);
    await this.transport.send("lsp/closeDocument", { uri });
  }

  async changeDocument(uri: string, changes: unknown): Promise<void> {
    if (!this.openDocuments.has(uri)) {
      throw new Error(`Document not open: ${uri}`);
    }
    await this.transport.send("lsp/changeDocument", { uri, changes });
  }

  async getDefinition(uri: string, line: number, column: number): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.transport.on("lsp/definition/result", (data) => {
        unsubscribe();
        resolve(data);
      });
      this.transport.send("lsp/definition", { uri, line, column }).catch(reject);
    });
  }

  async getReferences(uri: string, line: number, column: number): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.transport.on("lsp/references/result", (data) => {
        unsubscribe();
        resolve(data);
      });
      this.transport.send("lsp/references", { uri, line, column }).catch(reject);
    });
  }

  async getHover(uri: string, line: number, column: number): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.transport.on("lsp/hover/result", (data) => {
        unsubscribe();
        resolve(data);
      });
      this.transport.send("lsp/hover", { uri, line, column }).catch(reject);
    });
  }

  async getCompletion(uri: string, line: number, column: number): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.transport.on("lsp/completion/result", (data) => {
        unsubscribe();
        resolve(data);
      });
      this.transport.send("lsp/completion", { uri, line, column }).catch(reject);
    });
  }
}

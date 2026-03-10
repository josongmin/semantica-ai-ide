/**
 * Virtual demo files for the IDE preview.
 * Used when no real workspace is connected.
 */
export const DEMO_FILES: Readonly<Record<string, string>> = {
  "src/app/main.ts": `import { createApp } from "./core";
import { setupRouter } from "./router";
import { initStore } from "./store";

async function bootstrap() {
  const app = createApp();
  const store = initStore();
  const router = setupRouter(store);

  app.use(store);
  app.use(router);

  await app.mount("#app");
  console.log("[Semantica] Application ready");
}

bootstrap().catch(console.error);
`,

  "src/core/agent.ts": `import type { AgentConfig, AgentMessage, ModelProvider } from "./types";

export class Agent {
  private readonly config: AgentConfig;
  private readonly provider: ModelProvider;
  private history: AgentMessage[] = [];

  constructor(config: AgentConfig, provider: ModelProvider) {
    this.config = config;
    this.provider = provider;
  }

  async execute(prompt: string): Promise<AgentMessage> {
    const systemPrompt = this.buildSystemPrompt();
    this.history.push({ role: "user", content: prompt });

    const response = await this.provider.chat({
      model: this.config.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...this.history,
      ],
      temperature: this.config.temperature ?? 0.7,
      maxTokens: this.config.maxTokens ?? 4096,
    });

    const assistant: AgentMessage = {
      role: "assistant",
      content: response.content,
      toolCalls: response.toolCalls,
    };

    this.history.push(assistant);
    return assistant;
  }

  private buildSystemPrompt(): string {
    return [
      this.config.systemPrompt,
      \`Available tools: \${this.config.tools.map((t) => t.name).join(", ")}\`,
      \`Working directory: \${this.config.cwd}\`,
    ].join("\\n\\n");
  }

  reset(): void {
    this.history = [];
  }
}
`,

  "src/core/types.ts": `export interface AgentConfig {
  readonly name: string;
  readonly model: string;
  readonly systemPrompt: string;
  readonly tools: readonly ToolDefinition[];
  readonly cwd: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, ParameterDef>;
}

export interface ParameterDef {
  readonly type: "string" | "number" | "boolean" | "object" | "array";
  readonly description: string;
  readonly required?: boolean;
}

export interface AgentMessage {
  readonly role: "user" | "assistant" | "system";
  readonly content: string;
  readonly toolCalls?: readonly ToolCall[];
}

export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Record<string, unknown>;
}

export interface ModelProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}

export interface ChatRequest {
  readonly model: string;
  readonly messages: readonly AgentMessage[];
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface ChatResponse {
  readonly content: string;
  readonly toolCalls?: readonly ToolCall[];
  readonly usage: { promptTokens: number; completionTokens: number };
}
`,

  "src/utils/fileSystem.ts": `import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

export async function listFiles(
  dir: string,
  pattern?: RegExp,
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFiles(fullPath, pattern)));
    } else if (!pattern || pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results.sort();
}
`,

  "package.json": `{
  "name": "semantica-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "dependencies": {
    "jotai": "^2.10.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^4.0.0"
  }
}
`,
};

/** Default file to open on first launch */
export const DEMO_DEFAULT_FILE = "src/core/agent.ts";

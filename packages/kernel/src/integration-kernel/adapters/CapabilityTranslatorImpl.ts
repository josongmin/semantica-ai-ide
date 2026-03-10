import type { CapabilityTranslator, PolicyQuery, PolicyResult } from "../types.js";
import type { KernelTransport } from "../factory.js";
import {
  validateCapabilities,
  validateCapabilityCheck,
  validatePolicyResult,
  validateVerdict,
} from "./validation.js";

export class CapabilityTranslatorImpl implements CapabilityTranslator {
  private readonly capabilities = new Set<string>();
  private readonly verdictCache = new Map<string, unknown>();

  constructor(private readonly transport: KernelTransport) {
    // Listen for capability updates from the backend
    this.transport.on("policy/capabilities", (data) => {
      const caps = validateCapabilities(data);
      this.capabilities.clear();
      for (const cap of caps) {
        this.capabilities.add(cap);
      }
    });

    // Listen for verdict updates
    this.transport.on("policy/verdict", (data) => {
      const verdict = validateVerdict(data);
      this.verdictCache.set(verdict.patchId, verdict.result);
    });
  }

  async checkCapability(action: string): Promise<boolean> {
    // Check local cache first
    if (this.capabilities.size > 0) {
      return this.capabilities.has(action);
    }
    // If no capabilities loaded yet, ask the backend
    return new Promise((resolve, reject) => {
      const unsubscribe = this.transport.on("policy/checkCapability/result", (data) => {
        unsubscribe();
        resolve(validateCapabilityCheck(data).allowed);
      });
      this.transport.send("policy/checkCapability", { action }).catch(reject);
    });
  }

  async evaluatePolicy(query: PolicyQuery): Promise<PolicyResult> {
    // High/critical risk actions default to require_approval if no backend responds
    return new Promise((resolve, reject) => {
      let unsubscribe: () => void;

      const timeout = setTimeout(() => {
        unsubscribe?.();
        // Default policy: allow low/medium, require_approval for high/critical
        if (query.riskLevel === "high" || query.riskLevel === "critical") {
          resolve({
            outcome: "require_approval",
            reason: "High-risk action requires approval (default policy)",
            approvalRequired: true,
          });
        } else {
          resolve({
            outcome: "allow",
            reason: "Default allow policy",
            approvalRequired: false,
          });
        }
      }, 5000);

      unsubscribe = this.transport.on("policy/evaluate/result", (data) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(validatePolicyResult(data) as PolicyResult);
      });

      this.transport.send("policy/evaluate", query).catch((err) => {
        clearTimeout(timeout);
        unsubscribe();
        reject(err);
      });
    });
  }

  async getVerdict(patchId: string): Promise<unknown> {
    // Check cache first
    const cached = this.verdictCache.get(patchId);
    if (cached !== undefined) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const unsubscribe = this.transport.on("policy/verdict/result", (data) => {
        const verdict = validateVerdict(data);
        if (verdict.patchId === patchId) {
          unsubscribe();
          this.verdictCache.set(patchId, verdict.result);
          resolve(verdict.result);
        }
      });
      this.transport.send("policy/getVerdict", { patchId }).catch(reject);
    });
  }
}

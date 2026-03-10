import type { Unsubscribe } from "@semantica/protocol";
import type { EventBridge, EventHandler } from "../types.js";
import { validateDomainEvent, type ValidatedDomainEvent } from "./validation.js";

export class EventBridgeImpl implements EventBridge {
  private readonly domainHandlers = new Map<string, Set<EventHandler>>();
  private readonly globalHandlers = new Set<EventHandler>();
  private readonly snapshots = new Map<string, ValidatedDomainEvent>();

  subscribe(domain: string, handler: EventHandler): Unsubscribe {
    let handlers = this.domainHandlers.get(domain);
    if (!handlers) {
      handlers = new Set();
      this.domainHandlers.set(domain, handlers);
    }
    handlers.add(handler);

    return () => {
      handlers!.delete(handler);
      if (handlers!.size === 0) {
        this.domainHandlers.delete(domain);
      }
    };
  }

  subscribeAll(handler: EventHandler): Unsubscribe {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  getSnapshot(domain: string): unknown {
    return this.snapshots.get(domain);
  }

  emit(event: unknown): void {
    const domainEvent = validateDomainEvent(event);
    const { domain } = domainEvent;

    // Update snapshot for the domain
    if (domain) {
      this.snapshots.set(domain, domainEvent);
    }

    // Notify domain-scoped handlers
    if (domain) {
      const handlers = this.domainHandlers.get(domain);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(domainEvent);
          } catch {
            // Swallow handler errors to avoid breaking the event loop
          }
        }
      }
    }

    // Notify global handlers
    for (const handler of this.globalHandlers) {
      try {
        handler(domainEvent);
      } catch {
        // Swallow handler errors to avoid breaking the event loop
      }
    }
  }
}

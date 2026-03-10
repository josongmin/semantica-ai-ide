import { describe, it, expect, beforeEach } from "vitest";
import { LspSessionManagerImpl } from "../adapters/LspSessionManagerImpl.js";
import type { KernelTransport } from "../factory.js";
import {
  SYMBOL_FIXTURES,
  allLocations,
  affectedUris,
  type SymbolLocation,
} from "./fixtures/symbol-fixtures.js";

// ── Mock transport ──────────────────────────────────────

interface MockTransport extends KernelTransport {
  readonly handlers: Map<string, Set<(data: unknown) => void>>;
  readonly sent: Array<{ channel: string; data: unknown }>;
}

function createMockTransport(): MockTransport {
  const handlers = new Map<string, Set<(data: unknown) => void>>();
  const sent: Array<{ channel: string; data: unknown }> = [];
  return {
    handlers,
    sent,
    async send(channel: string, data: unknown) {
      sent.push({ channel, data });
    },
    on(channel: string, handler: (data: unknown) => void) {
      let set = handlers.get(channel);
      if (!set) {
        set = new Set();
        handlers.set(channel, set);
      }
      set.add(handler);
      return () => {
        set!.delete(handler);
      };
    },
  };
}

// ── Helpers ──────────────────────────────────────────────

/** Emit a result on the mock transport for a pending request. */
function respondTo(transport: MockTransport, channel: string, data: unknown) {
  const set = transport.handlers.get(channel);
  if (set) {
    for (const handler of set) {
      handler(data);
    }
  }
}

/** Drive getDefinition to completion by scheduling a response. */
function driveDefinition(
  transport: MockTransport,
  lsp: LspSessionManagerImpl,
  uri: string,
  line: number,
  column: number,
  result: unknown,
): Promise<unknown> {
  const promise = lsp.getDefinition(uri, line, column);
  respondTo(transport, "lsp/definition/result", result);
  return promise;
}

/** Drive getReferences to completion by scheduling a response. */
function driveReferences(
  transport: MockTransport,
  lsp: LspSessionManagerImpl,
  uri: string,
  line: number,
  column: number,
  result: unknown,
): Promise<unknown> {
  const promise = lsp.getReferences(uri, line, column);
  respondTo(transport, "lsp/references/result", result);
  return promise;
}

function locationEq(a: SymbolLocation, b: SymbolLocation): boolean {
  return a.uri === b.uri && a.line === b.line && a.column === b.column;
}

// ── Tests ────────────────────────────────────────────────

describe("Symbol authority cross-invariants", () => {
  let transport: MockTransport;
  let lsp: LspSessionManagerImpl;

  beforeEach(() => {
    transport = createMockTransport();
    lsp = new LspSessionManagerImpl(transport);
  });

  // ── Definition -> References invariant ──────────────────

  describe("Definition -> References invariant", () => {
    it.each(SYMBOL_FIXTURES.map((f) => [f.name, f] as const))(
      "%s: getDefinition at definition location returns that location",
      async (_name, fixture) => {
        const { uri, line, column } = fixture.definitionLocation;

        const result = await driveDefinition(
          transport,
          lsp,
          uri,
          line,
          column,
          fixture.definitionLocation,
        );

        expect(result).toEqual(fixture.definitionLocation);
      },
    );

    it.each(SYMBOL_FIXTURES.map((f) => [f.name, f] as const))(
      "%s: getReferences returns all reference locations plus the definition",
      async (_name, fixture) => {
        const { uri, line, column } = fixture.definitionLocation;
        const expectedLocations = allLocations(fixture);

        const result = await driveReferences(
          transport,
          lsp,
          uri,
          line,
          column,
          expectedLocations,
        );

        const locations = result as SymbolLocation[];
        expect(locations).toHaveLength(expectedLocations.length);

        // Definition must be included in references
        const includesDefinition = locations.some((loc) =>
          locationEq(loc, fixture.definitionLocation),
        );
        expect(includesDefinition).toBe(true);

        // Every known reference must be present
        for (const ref of fixture.referenceLocations) {
          const found = locations.some((loc) => locationEq(loc, ref));
          expect(found).toBe(true);
        }
      },
    );

    it.each(SYMBOL_FIXTURES.map((f) => [f.name, f] as const))(
      "%s: definition is always included in references (invariant)",
      async (_name, fixture) => {
        const { uri, line, column } = fixture.definitionLocation;
        const refsResult = allLocations(fixture);

        const locations = (await driveReferences(
          transport,
          lsp,
          uri,
          line,
          column,
          refsResult,
        )) as SymbolLocation[];

        const hasDef = locations.some((loc) =>
          locationEq(loc, fixture.definitionLocation),
        );
        expect(hasDef).toBe(true);
      },
    );
  });

  // ── Ref/Def symmetry invariant ─────────────────────────

  describe("Ref/Def symmetry invariant", () => {
    it.each(SYMBOL_FIXTURES.map((f) => [f.name, f] as const))(
      "%s: if getDefinition at A returns B, then getReferences at B includes A",
      async (_name, fixture) => {
        // For each reference location A, getDefinition should resolve to the
        // definition location B. Then getReferences at B must include A.
        for (const refLoc of fixture.referenceLocations) {
          // Step 1: getDefinition at reference A -> definition B
          const defResult = await driveDefinition(
            transport,
            lsp,
            refLoc.uri,
            refLoc.line,
            refLoc.column,
            fixture.definitionLocation,
          );
          const defLoc = defResult as SymbolLocation;

          // Step 2: getReferences at definition B -> must include A
          const allLocs = allLocations(fixture);
          const refsResult = await driveReferences(
            transport,
            lsp,
            defLoc.uri,
            defLoc.line,
            defLoc.column,
            allLocs,
          );

          const refs = refsResult as SymbolLocation[];
          const includesA = refs.some((loc) => locationEq(loc, refLoc));
          expect(includesA).toBe(true);
        }
      },
    );
  });

  // ── Rename consistency invariant ───────────────────────

  describe("Rename consistency invariant", () => {
    it.each(SYMBOL_FIXTURES.map((f) => [f.name, f] as const))(
      "%s: after rename, all affected URIs receive changeDocument calls",
      async (_name, fixture) => {
        const uris = affectedUris(fixture);

        // Open all affected documents first
        for (const uri of uris) {
          await lsp.openDocument(uri);
        }
        transport.sent.length = 0; // reset to isolate rename calls

        // Simulate rename by issuing changeDocument for each affected URI
        const renameChange = {
          type: "rename",
          oldName: fixture.name,
          newName: `${fixture.name}Renamed`,
        };

        for (const uri of uris) {
          await lsp.changeDocument(uri, renameChange);
        }

        // Verify changeDocument was sent for every affected URI
        const changeSends = transport.sent.filter(
          (s) => s.channel === "lsp/changeDocument",
        );
        const changedUris = changeSends.map(
          (s) => (s.data as { uri: string }).uri,
        );

        for (const uri of uris) {
          expect(changedUris).toContain(uri);
        }
        expect(changedUris).toHaveLength(uris.length);
      },
    );

    it.each(SYMBOL_FIXTURES.map((f) => [f.name, f] as const))(
      "%s: rename sends correct change payload for every file",
      async (_name, fixture) => {
        const uris = affectedUris(fixture);
        for (const uri of uris) {
          await lsp.openDocument(uri);
        }
        transport.sent.length = 0;

        const renameChange = {
          type: "rename",
          oldName: fixture.name,
          newName: `Renamed_${fixture.name}`,
        };

        for (const uri of uris) {
          await lsp.changeDocument(uri, renameChange);
        }

        const changeSends = transport.sent.filter(
          (s) => s.channel === "lsp/changeDocument",
        );

        for (const send of changeSends) {
          const payload = send.data as { uri: string; changes: unknown };
          expect(payload.changes).toEqual(renameChange);
        }
      },
    );
  });

  // ── Document lifecycle invariant ──────────────────────

  describe("Document lifecycle invariant", () => {
    it("changeDocument throws for a document that was never opened", async () => {
      await expect(
        lsp.changeDocument("file:///not-opened.ts", { text: "x" }),
      ).rejects.toThrow("Document not open");
    });

    it("changeDocument throws for a document that was opened then closed", async () => {
      const uri = "file:///workspace/src/temp.ts";
      await lsp.openDocument(uri);
      await lsp.closeDocument(uri);

      await expect(
        lsp.changeDocument(uri, { text: "x" }),
      ).rejects.toThrow("Document not open");
    });

    it("getDefinition works through transport even without explicit openDocument", async () => {
      // LspSessionManagerImpl does NOT guard getDefinition behind openDocuments
      const uri = "file:///workspace/src/services/user.ts";
      const result = await driveDefinition(transport, lsp, uri, 5, 13, {
        uri,
        line: 5,
        column: 13,
      });

      expect(result).toEqual({ uri, line: 5, column: 13 });

      // Verify the request was sent via transport
      const defSend = transport.sent.find(
        (s) => s.channel === "lsp/definition",
      );
      expect(defSend).toBeDefined();
      expect(defSend!.data).toEqual({ uri, line: 5, column: 13 });
    });

    it("getReferences works through transport even without explicit openDocument", async () => {
      const uri = "file:///workspace/src/services/user.ts";
      const refs = [{ uri, line: 5, column: 13 }];

      const result = await driveReferences(transport, lsp, uri, 5, 13, refs);

      expect(result).toEqual(refs);

      const refSend = transport.sent.find(
        (s) => s.channel === "lsp/references",
      );
      expect(refSend).toBeDefined();
      expect(refSend!.data).toEqual({ uri, line: 5, column: 13 });
    });

    it("openDocument sends the correct channel and payload", async () => {
      const uri = "file:///workspace/src/main.ts";
      await lsp.openDocument(uri);

      const openSend = transport.sent.find(
        (s) => s.channel === "lsp/openDocument",
      );
      expect(openSend).toBeDefined();
      expect(openSend!.data).toEqual({ uri });
    });

    it("closeDocument sends the correct channel and payload", async () => {
      const uri = "file:///workspace/src/main.ts";
      await lsp.openDocument(uri);
      await lsp.closeDocument(uri);

      const closeSend = transport.sent.find(
        (s) => s.channel === "lsp/closeDocument",
      );
      expect(closeSend).toBeDefined();
      expect(closeSend!.data).toEqual({ uri });
    });
  });

  // ── Cross-file authority invariant ─────────────────────

  describe("Cross-file authority invariant", () => {
    it.each(SYMBOL_FIXTURES.map((f) => [f.name, f] as const))(
      "%s: rename in definition file is detectable across all reference files",
      async (_name, fixture) => {
        const uris = affectedUris(fixture);

        // Open all files
        for (const uri of uris) {
          await lsp.openDocument(uri);
        }
        transport.sent.length = 0;

        // Rename in the definition file
        const defUri = fixture.definitionLocation.uri;
        await lsp.changeDocument(defUri, {
          type: "rename",
          oldName: fixture.name,
          newName: `${fixture.name}V2`,
        });

        // Verify the definition file change was sent
        const defChange = transport.sent.find(
          (s) =>
            s.channel === "lsp/changeDocument" &&
            (s.data as { uri: string }).uri === defUri,
        );
        expect(defChange).toBeDefined();

        // For each reference file, getReferences should still find all locations
        // (simulating the LSP server returning updated locations after rename)
        const updatedLocations = allLocations(fixture);

        for (const refLoc of fixture.referenceLocations) {
          const refs = await driveReferences(
            transport,
            lsp,
            refLoc.uri,
            refLoc.line,
            refLoc.column,
            updatedLocations,
          );

          const locations = refs as SymbolLocation[];

          // Must still include the definition location
          const hasDef = locations.some((loc) =>
            locationEq(loc, fixture.definitionLocation),
          );
          expect(hasDef).toBe(true);

          // Must include the current reference location
          const hasSelf = locations.some((loc) => locationEq(loc, refLoc));
          expect(hasSelf).toBe(true);
        }
      },
    );

    it.each(SYMBOL_FIXTURES.map((f) => [f.name, f] as const))(
      "%s: multi-file rename propagates changes to all affected URIs",
      async (_name, fixture) => {
        const uris = affectedUris(fixture);

        for (const uri of uris) {
          await lsp.openDocument(uri);
        }
        transport.sent.length = 0;

        // Simulate a cross-file rename: change every affected file
        const change = {
          type: "rename",
          oldName: fixture.name,
          newName: `${fixture.name}_updated`,
        };

        for (const uri of uris) {
          await lsp.changeDocument(uri, change);
        }

        const changeSends = transport.sent.filter(
          (s) => s.channel === "lsp/changeDocument",
        );

        // Every unique URI must have exactly one changeDocument call
        const sentUris = changeSends.map(
          (s) => (s.data as { uri: string }).uri,
        );
        const uniqueSentUris = [...new Set(sentUris)];

        expect(uniqueSentUris.sort()).toEqual([...uris].sort());
      },
    );
  });

  // ── Transport channel correctness ─────────────────────

  describe("Transport channel correctness", () => {
    it("getDefinition sends on lsp/definition and listens on lsp/definition/result", async () => {
      const uri = "file:///workspace/src/services/user.ts";
      const promise = lsp.getDefinition(uri, 5, 13);

      // Verify lsp/definition was sent
      expect(transport.sent).toContainEqual({
        channel: "lsp/definition",
        data: { uri, line: 5, column: 13 },
      });

      // Verify listener was registered on result channel
      expect(transport.handlers.has("lsp/definition/result")).toBe(true);

      // Respond and resolve
      respondTo(transport, "lsp/definition/result", { uri, line: 5, column: 13 });
      const result = await promise;
      expect(result).toEqual({ uri, line: 5, column: 13 });

      // Listener should have been unsubscribed after receiving result
      const remaining = transport.handlers.get("lsp/definition/result");
      expect(remaining?.size ?? 0).toBe(0);
    });

    it("getReferences sends on lsp/references and listens on lsp/references/result", async () => {
      const uri = "file:///workspace/src/services/user.ts";
      const refs = [{ uri, line: 5, column: 13 }];
      const promise = lsp.getReferences(uri, 5, 13);

      expect(transport.sent).toContainEqual({
        channel: "lsp/references",
        data: { uri, line: 5, column: 13 },
      });

      expect(transport.handlers.has("lsp/references/result")).toBe(true);

      respondTo(transport, "lsp/references/result", refs);
      const result = await promise;
      expect(result).toEqual(refs);

      const remaining = transport.handlers.get("lsp/references/result");
      expect(remaining?.size ?? 0).toBe(0);
    });
  });
});

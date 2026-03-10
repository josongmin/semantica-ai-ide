// ── Symbol fixture types ────────────────────────────────

export interface SymbolLocation {
  readonly uri: string;
  readonly line: number;
  readonly column: number;
}

export interface SymbolFixture {
  readonly uri: string;
  readonly name: string;
  readonly kind: "function" | "class" | "variable" | "type" | "file";
  readonly definitionLocation: SymbolLocation;
  readonly referenceLocations: readonly SymbolLocation[];
}

// ── Fixtures ────────────────────────────────────────────

export const SYMBOL_FIXTURES: readonly SymbolFixture[] = [
  {
    uri: "file:///workspace/src/services/user.ts",
    name: "UserService",
    kind: "class",
    definitionLocation: {
      uri: "file:///workspace/src/services/user.ts",
      line: 5,
      column: 13,
    },
    referenceLocations: [
      {
        uri: "file:///workspace/src/handlers/api.ts",
        line: 3,
        column: 9,
      },
      {
        uri: "file:///workspace/src/services/auth.ts",
        line: 12,
        column: 22,
      },
      {
        uri: "file:///workspace/src/main.ts",
        line: 8,
        column: 18,
      },
    ],
  },
  {
    uri: "file:///workspace/src/utils/validation.ts",
    name: "validateEmail",
    kind: "function",
    definitionLocation: {
      uri: "file:///workspace/src/utils/validation.ts",
      line: 10,
      column: 16,
    },
    referenceLocations: [
      {
        uri: "file:///workspace/src/services/user.ts",
        line: 22,
        column: 4,
      },
      {
        uri: "file:///workspace/src/handlers/api.ts",
        line: 17,
        column: 10,
      },
    ],
  },
  {
    uri: "file:///workspace/src/types/auth.ts",
    name: "AuthConfig",
    kind: "type",
    definitionLocation: {
      uri: "file:///workspace/src/types/auth.ts",
      line: 1,
      column: 12,
    },
    referenceLocations: [
      {
        uri: "file:///workspace/src/services/auth.ts",
        line: 1,
        column: 9,
      },
      {
        uri: "file:///workspace/src/services/user.ts",
        line: 2,
        column: 9,
      },
      {
        uri: "file:///workspace/src/config/constants.ts",
        line: 4,
        column: 25,
      },
      {
        uri: "file:///workspace/src/main.ts",
        line: 3,
        column: 9,
      },
    ],
  },
  {
    uri: "file:///workspace/src/config/constants.ts",
    name: "DEFAULT_TIMEOUT",
    kind: "variable",
    definitionLocation: {
      uri: "file:///workspace/src/config/constants.ts",
      line: 8,
      column: 13,
    },
    referenceLocations: [
      {
        uri: "file:///workspace/src/services/user.ts",
        line: 30,
        column: 20,
      },
      {
        uri: "file:///workspace/src/handlers/api.ts",
        line: 7,
        column: 26,
      },
      {
        uri: "file:///workspace/src/utils/validation.ts",
        line: 3,
        column: 9,
      },
    ],
  },
  {
    uri: "file:///workspace/src/handlers/api.ts",
    name: "handleRequest",
    kind: "function",
    definitionLocation: {
      uri: "file:///workspace/src/handlers/api.ts",
      line: 20,
      column: 22,
    },
    referenceLocations: [
      {
        uri: "file:///workspace/src/main.ts",
        line: 15,
        column: 2,
      },
      {
        uri: "file:///workspace/src/services/auth.ts",
        line: 25,
        column: 8,
      },
    ],
  },
] as const;

// ── Helpers ─────────────────────────────────────────────

/** All locations (definition + references) for a fixture. */
export function allLocations(fixture: SymbolFixture): SymbolLocation[] {
  return [fixture.definitionLocation, ...fixture.referenceLocations];
}

/** Unique URIs touched by a fixture. */
export function affectedUris(fixture: SymbolFixture): string[] {
  const uris = new Set<string>();
  uris.add(fixture.definitionLocation.uri);
  for (const ref of fixture.referenceLocations) {
    uris.add(ref.uri);
  }
  return [...uris];
}

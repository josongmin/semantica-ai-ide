import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  isScopeGuardActiveAtom,
  isScopeViolationAtom,
  matchesGlob,
  scopeExcludesAtom,
  scopeIncludesAtom,
  setScopeGuardAtom,
} from "~shared/bootstrap/scope-guard";

import { ScopeViolationBanner } from "../ScopeViolationBanner";

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("matchesGlob", () => {
  it("matches exact file paths", () => {
    expect(matchesGlob("src/index.ts", "src/index.ts")).toBe(true);
  });

  it("matches single wildcard *", () => {
    expect(matchesGlob("src/index.ts", "src/*.ts")).toBe(true);
    expect(matchesGlob("src/deep/index.ts", "src/*.ts")).toBe(false);
  });

  it("matches double wildcard **", () => {
    expect(matchesGlob("src/deep/index.ts", "src/**/*.ts")).toBe(true);
    expect(matchesGlob("src/a/b/c.ts", "src/**/*.ts")).toBe(true);
  });

  it("does not match unrelated paths", () => {
    expect(matchesGlob("lib/index.ts", "src/**/*.ts")).toBe(false);
  });

  it("matches directory patterns", () => {
    expect(matchesGlob("src/utils/helpers.ts", "src/utils/**")).toBe(true);
  });
});

describe("scopeGuardAtoms", () => {
  it("setScopeGuardAtom sets both includes and excludes", () => {
    const store = createStore();

    store.set(setScopeGuardAtom, {
      includes: ["src/**"],
      excludes: ["src/secrets/**"],
    });

    expect(store.get(scopeIncludesAtom)).toEqual(["src/**"]);
    expect(store.get(scopeExcludesAtom)).toEqual(["src/secrets/**"]);
  });

  it("isScopeGuardActiveAtom returns false when no rules", () => {
    const store = createStore();
    expect(store.get(isScopeGuardActiveAtom)).toBe(false);
  });

  it("isScopeGuardActiveAtom returns true when includes set", () => {
    const store = createStore();
    store.set(scopeIncludesAtom, ["src/**"]);
    expect(store.get(isScopeGuardActiveAtom)).toBe(true);
  });

  it("isScopeViolationAtom returns false when no rules", () => {
    const store = createStore();
    expect(store.get(isScopeViolationAtom("src/index.ts"))).toBe(false);
  });

  it("isScopeViolationAtom returns true when file outside includes", () => {
    const store = createStore();
    store.set(scopeIncludesAtom, ["src/**"]);
    expect(store.get(isScopeViolationAtom("lib/index.ts"))).toBe(true);
  });

  it("isScopeViolationAtom returns false when file matches includes", () => {
    const store = createStore();
    store.set(scopeIncludesAtom, ["src/**"]);
    expect(store.get(isScopeViolationAtom("src/app.ts"))).toBe(false);
  });

  it("isScopeViolationAtom returns true when file matches excludes", () => {
    const store = createStore();
    store.set(scopeExcludesAtom, ["*.secret"]);
    expect(store.get(isScopeViolationAtom("config.secret"))).toBe(true);
  });

  it("excludes take priority over includes", () => {
    const store = createStore();
    store.set(scopeIncludesAtom, ["src/**"]);
    store.set(scopeExcludesAtom, ["src/secrets/**"]);
    expect(store.get(isScopeViolationAtom("src/secrets/key.ts"))).toBe(true);
    expect(store.get(isScopeViolationAtom("src/app.ts"))).toBe(false);
  });
});

describe("ScopeViolationBanner", () => {
  it("renders nothing when file is in scope", () => {
    const { container } = renderWithStore(
      <ScopeViolationBanner filePath="src/app.ts" />,
      (store) => {
        store.set(scopeIncludesAtom, ["src/**"]);
      },
    );
    expect(container.querySelector("[data-testid='scope-violation-banner']")).toBeNull();
  });

  it("renders warning when file is outside scope", () => {
    renderWithStore(
      <ScopeViolationBanner filePath="lib/secret.ts" onAllow={vi.fn()} onDeny={vi.fn()} />,
      (store) => {
        store.set(scopeIncludesAtom, ["src/**"]);
      },
    );

    expect(screen.getByTestId("scope-violation-banner")).toBeInTheDocument();
    expect(screen.getByText("This file is outside the allowed scope.")).toBeInTheDocument();
  });

  it("calls onAllow when Allow button is clicked", () => {
    const onAllow = vi.fn();
    renderWithStore(
      <ScopeViolationBanner filePath="lib/secret.ts" onAllow={onAllow} />,
      (store) => {
        store.set(scopeIncludesAtom, ["src/**"]);
      },
    );

    fireEvent.click(screen.getByText("Allow"));
    expect(onAllow).toHaveBeenCalledOnce();
  });

  it("calls onDeny when Deny button is clicked", () => {
    const onDeny = vi.fn();
    renderWithStore(<ScopeViolationBanner filePath="lib/secret.ts" onDeny={onDeny} />, (store) => {
      store.set(scopeIncludesAtom, ["src/**"]);
    });

    fireEvent.click(screen.getByText("Deny"));
    expect(onDeny).toHaveBeenCalledOnce();
  });
});

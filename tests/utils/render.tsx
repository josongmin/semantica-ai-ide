import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Atom,createStore, Provider } from "jotai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAtom = Atom<any>;
type InitialValue = [AnyAtom, unknown];

type RenderWithAtomsOptions = Omit<RenderOptions, "wrapper"> & {
  initialValues?: InitialValue[];
};

/**
 * Custom render with isolated Jotai store.
 * Returns store for direct atom queries + userEvent instance.
 */
export function renderWithAtoms(
  ui: React.ReactElement,
  { initialValues, ...renderOptions }: RenderWithAtomsOptions = {},
) {
  const store = createStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValues?.forEach(([atom, value]) => store.set(atom as any, value));

  const user = userEvent.setup();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return { ...result, store, user };
}

export { render, userEvent };

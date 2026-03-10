import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * useControllable — unifies controlled and uncontrolled component patterns.
 *
 * When `controlledValue` is defined (not undefined), uses it directly.
 * When undefined, falls back to internal state initialized with `defaultValue`.
 *
 * The returned setter has a **stable identity** (never changes reference),
 * preventing unnecessary re-renders in consumers that depend on it.
 *
 * @example
 * // Uncontrolled (consumer doesn't pass `value`)
 * const [val, setVal] = useControllable(undefined, onChange, "default");
 *
 * // Controlled (consumer passes `value`)
 * const [val, setVal] = useControllable(controlledValue, onChange, "default");
 */
export function useControllable<T>(
  controlledValue: T | undefined,
  onChange: ((value: T) => void) | undefined,
  defaultValue: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue);
  const value = isControlled ? controlledValue : internal;

  // Refs for stable callback identity — synced every render
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const isControlledRef = useRef(isControlled);
  useLayoutEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    isControlledRef.current = isControlled;
  });

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const {current} = valueRef;
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      if (!isControlledRef.current) {
        setInternal(resolved);
      }
      onChangeRef.current?.(resolved);
    },
    [], // stable forever — reads from refs
  );

  return [value, setValue];
}

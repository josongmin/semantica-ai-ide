import { type Ref, useCallback } from "react";

/**
 * Merge multiple refs into a single callback ref.
 * Accepts forwarded refs (object or callback) and internal refs.
 *
 * @example
 * const internalRef = useRef<HTMLDivElement>(null);
 * const mergedRef = useMergeRefs(ref, internalRef);
 * return <div ref={mergedRef} />;
 */
export function useMergeRefs<T>(...refs: (Ref<T> | undefined)[]): (instance: T | null) => void {
  return useCallback(
    (instance: T | null) => {
      for (const ref of refs) {
        if (typeof ref === "function") {
          ref(instance);
        } else if (ref != null && typeof ref === "object") {
          // Standard merge-refs pattern: assign to ref.current (ref object is mutable by design)
          // eslint-disable-next-line react-hooks/immutability -- ref.current mutation is intentional for React ref API
          (ref as React.MutableRefObject<T | null>).current = instance;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo -- refs as rest params, deps must reflect ref list
    refs,
  );
}

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
        } else if (ref && typeof ref === "object") {
           
          (ref as React.MutableRefObject<T | null>).current = instance;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rest params as deps is intentional for ref merging
    refs,
  );
}

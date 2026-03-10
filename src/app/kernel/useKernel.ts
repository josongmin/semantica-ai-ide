import { useAtomValue } from "jotai";

import { kernelAtom } from "./kernelAtoms";
import type { IntegrationKernel } from "./types";

/**
 * Access the Integration Kernel instance.
 * Throws if the kernel has not been initialized yet.
 */
export function useKernel(): IntegrationKernel {
  const kernel = useAtomValue(kernelAtom);
  if (!kernel) {
    throw new Error(
      "Kernel not initialized. Wrap your app in KernelProvider.",
    );
  }
  return kernel;
}

import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { kernelAtom, kernelErrorAtom, kernelStatusAtom } from "./kernelAtoms";
import type { CreateKernelFn, KernelTransport } from "./types";

interface KernelProviderProps {
  children: React.ReactNode;
  transport: KernelTransport;
  createKernel: CreateKernelFn;
}

/**
 * Initializes the Integration Kernel on mount and stores it in Jotai atoms.
 * Must be placed high in the component tree.
 *
 * Accepts `transport` and `createKernel` as props so the provider is
 * decoupled from the actual kernel package (which may not be wired up yet).
 */
export function KernelProvider({
  children,
  transport,
  createKernel,
}: KernelProviderProps) {
  const setKernel = useSetAtom(kernelAtom);
  const setStatus = useSetAtom(kernelStatusAtom);
  const setError = useSetAtom(kernelErrorAtom);

  useEffect(() => {
    let disposed = false;
    setStatus("initializing");

    const kernel = createKernel(transport);
    kernel
      .initialize()
      .then(() => {
        if (!disposed) {
          setKernel(kernel);
          setStatus("ready");
        }
      })
      .catch((err: unknown) => {
        if (!disposed) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      });

    return () => {
      disposed = true;
      kernel.dispose();
    };
  }, [transport, createKernel, setKernel, setStatus, setError]);

  return <>{children}</>;
}

import { createContext, useContext } from "react";

/**
 * Context for customizing the portal mount target.
 *
 * All overlay components (Dialog, Popover, BottomSheet, SlideDrawer, etc.)
 * use this to determine where to render their portals.
 *
 * Defaults to `document.body`. Override with `PortalContainerProvider` for:
 * - Shadow DOM isolation
 * - iframe embedding
 * - Testing environments
 * - Multiple React roots
 *
 * @example
 * ```tsx
 * import { PortalContainerProvider } from "~shared/lib";
 *
 * // Mount overlays inside a Shadow DOM host
 * function ShadowApp({ shadowRoot }: { shadowRoot: ShadowRoot }) {
 *   return (
 *     <PortalContainerProvider value={shadowRoot as unknown as HTMLElement}>
 *       <App />
 *     </PortalContainerProvider>
 *   );
 * }
 * ```
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

/**
 * Provider to override the portal mount target for all overlays.
 * Wrap your app (or a subtree) to redirect portals to a custom container.
 */
export const PortalContainerProvider = PortalContainerContext.Provider;

/**
 * Returns the portal container element for overlay rendering.
 * Falls back to `document.body` if no provider is present.
 */
export function usePortalContainer(): HTMLElement {
  const ctx = useContext(PortalContainerContext);
  return ctx ?? document.body;
}

/**
 * Module augmentation: adds `debugLabel` to Jotai's `AtomFamily` interface.
 *
 * Jotai atoms have an optional `debugLabel` property (declared in `jotai/vanilla`),
 * but the `AtomFamily` callable interface returned by `atomFamily()` omits it
 * even though the runtime object supports it.
 *
 * NOTE: With moduleResolution "bundler", augmenting "jotai/vanilla/utils/atomFamily"
 * does not reliably merge into the AtomFamily type seen by consumers importing from
 * "jotai/utils". Until Jotai v3 (which uses jotai-family), call sites must use
 * `(family as any).debugLabel = "name"`. This file is kept as documentation.
 */
declare module "jotai/vanilla/utils/atomFamily" {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- must match Jotai's AtomFamily type parameters
  interface AtomFamily<_Param, _AtomType> {
    debugLabel?: string;
  }
}

/**
 * Single hook that iterates the feature registry and invokes every
 * registered bootstrap hook in priority order.
 *
 * Replace N individual hook calls in StreamingBootstrap with one
 * `useFeatureBootstrap()` call.
 *
 * IMPORTANT: `src/app/bootstrapFeatures.ts` must be imported (side-effect)
 * before this hook runs so the registry is populated.
 */

// Side-effect import — populates the registry
import "./bootstrapFeatures";

import { getBootstrapFeatures } from "./featureRegistry";

export function useFeatureBootstrap(): void {
  const features = getBootstrapFeatures();
  for (const f of features) {
    f.hook();
  }
}

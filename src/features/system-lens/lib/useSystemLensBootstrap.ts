/**
 * useSystemLensBootstrap — RFC-SYSTEM-LENS-001 §9
 *
 * Auto-loads system lens badge data for open files in dev mode.
 * In production, this would be triggered by the Quanta Engine.
 */

import { useEffect, useRef } from "react";
import { useSetAtom } from "jotai";

import { loadLensBadgesAtom } from "../model/atoms";

const DEV_FILES = [
  "src/auth/AuthController.ts",
  "src/auth/AuthService.ts",
  "src/auth/TokenService.ts",
  "src/user/UserRepository.ts",
  "src/api/Gateway.ts",
  "src/payments/PaymentService.ts",
  "src/middleware/RateLimit.ts",
  "src/config/ConfigLoader.ts",
];

export function useSystemLensBootstrap(): void {
  const loadBadges = useSetAtom(loadLensBadgesAtom);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Stagger loading to avoid blocking UI
    DEV_FILES.forEach((file, i) => {
      setTimeout(() => loadBadges(file), 50 * i);
    });
  }, [loadBadges]);
}

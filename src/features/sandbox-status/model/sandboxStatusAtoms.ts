import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { SandboxStatus } from "../../../shared/protocol";

const DEFAULT_SANDBOX_STATUS: SandboxStatus = {
  enabled: false,
  network_policy: "block_all",
  allowed_hosts: [],
  denied_hosts: [],
  violations: [],
};

export const [sandboxStatusAtom, setSandboxStatusAtom, resetSandboxStatusAtom] =
  createStateAtomSet<SandboxStatus>(DEFAULT_SANDBOX_STATUS);

registerResetAtom(resetSandboxStatusAtom);

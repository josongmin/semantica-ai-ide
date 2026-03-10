/**
 * Protocol type mapping — converts internal mock types to protocol types for serverEvent emission.
 */
import type {
  ChangeSize as ProtoChangeSize,
  IntentType as ProtoIntentType,
  RiskLevel as ProtoRiskLevel,
  UncertaintyLevel as ProtoUncertaintyLevel,
} from "../../../../shared/protocol";
import type { Classification, MockChangeSize, MockIntentType, MockRiskLevel, Uncertainty } from "./types";

const INTENT_TO_PROTO: Record<MockIntentType, ProtoIntentType> = {
  Q_INFO: "question",
  Q_LOCATE: "question",
  Q_DIAG: "bug_fix",
  Q_FIX: "bug_fix",
  Q_REFACTOR: "refactor",
  Q_SEC: "bug_fix",
  Q_PERF: "refactor",
  Q_SPEC: "docs",
  Q_MIGRATE: "feature",
};

const RISK_TO_PROTO: Record<MockRiskLevel, ProtoRiskLevel> = {
  R0: "safe", R1: "safe", R2: "moderate", R3: "dangerous", R4: "dangerous",
};

const CHANGE_TO_PROTO: Record<MockChangeSize, ProtoChangeSize> = {
  C0: "trivial", C1: "small", C2: "medium", C3: "large",
};

const UNCERTAINTY_TO_PROTO: Record<Uncertainty, ProtoUncertaintyLevel> = {
  U0: "low", U1: "low", U2: "medium", U3: "high",
};

/** Convert internal classification → protocol-compatible InputGateResult */
export function toProtoClassification(c: Classification) {
  return {
    intent_type: INTENT_TO_PROTO[c.intent],
    risk_level: RISK_TO_PROTO[c.risk],
    change_size: CHANGE_TO_PROTO[c.changeSize],
    uncertainty: UNCERTAINTY_TO_PROTO[c.uncertainty],
  };
}

/** Map internal mock risk level → protocol RiskLevel */
export function toProtoRiskLevel(risk: MockRiskLevel): ProtoRiskLevel {
  return RISK_TO_PROTO[risk];
}

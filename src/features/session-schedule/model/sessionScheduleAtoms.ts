import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { SessionSchedule } from "../../../shared/protocol";

export const [sessionSchedulesAtom, setSessionSchedulesAtom, resetSessionScheduleAtom] =
  createStateAtomSet<readonly SessionSchedule[]>([]);

registerResetAtom(resetSessionScheduleAtom);

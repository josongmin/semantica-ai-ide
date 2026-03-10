import { atom } from "jotai";

import { createPushAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { AppNotification } from "../../../shared/protocol";

export const [notificationsAtom, pushNotificationAtom, resetNotificationsAtom] =
  createPushAtomSet<AppNotification>();

export const dismissNotificationAtom = atom(null, (get, set, id: string) => {
  const current = get(notificationsAtom);
  set(notificationsAtom, current.filter((n) => n.id !== id));
});

registerResetAtom(resetNotificationsAtom);

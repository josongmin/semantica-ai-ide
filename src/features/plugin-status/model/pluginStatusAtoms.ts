import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { PluginInfo } from "../../../shared/protocol";

export const [pluginListAtom, setPluginListAtom, resetPluginStatusAtom] =
  createStateAtomSet<readonly PluginInfo[]>([]);

registerResetAtom(resetPluginStatusAtom);

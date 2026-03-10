import { createPushAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { PromptSuggestion } from "../../../shared/protocol";

export const [promptSuggestionsAtom, pushPromptSuggestionAtom, resetPromptSuggestionsAtom] =
  createPushAtomSet<PromptSuggestion>();

registerResetAtom(resetPromptSuggestionsAtom);

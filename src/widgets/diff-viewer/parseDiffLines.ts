// Re-export from shared/lib — canonical location for FSD compliance
export {
  buildHiddenSet,
  type ContextGroup,
  type DiffLine,
  type DiffLineType,
  findCollapsibleGroups,
  lineStyles,
  parseDiffLines,
} from "../../shared/lib/parseDiffLines";

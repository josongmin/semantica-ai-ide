// ─── Primitives (Tier 1) ───────────────────────────────────
export {
  Accordion,
  AlertDialog,
  Badge,
  BarChart,
  BottomSheet,
  Breadcrumbs,
  Button,
  Checkbox,
  CodeBlockActions,
  Collapsible,
  ConfirmDialog,
  Dialog,
  DiffSkeleton,
  ErrorBoundary,
  FeaturePanel,
  FileChangeSkeleton,
  FileIcon,
  FolderIcon,
  FormField,
  HighlightedText,
  HoverCard,
  Icon,
  Input,
  Kbd,
  MessageSkeleton,
  ModalOverlay,
  OverlayPortal,
  Pagination,
  Popover,
  ProgressBar,
  RadioGroup,
  SegmentedControl,
  Select,
  Separator,
  SessionCardSkeleton,
  SessionRowSkeleton,
  Skeleton,
  SlideDrawer,
  Slot,
  Spinner,
  StatusDot,
  StreamingCursor,
  Switch,
  Tabs,
  Text,
  Textarea,
  ThinkingIndicator,
  ToastContainer,
  ToolbarButton,
  ToolCallSkeleton,
  Tooltip,
  TurnSkeleton,
  VisuallyHidden,
  WaveformBar,
} from "./primitives";

// ─── Composites (Tier 2) ──────────────────────────────────
export type { ContextMenuGroup, ContextMenuItem, ContextMenuProps } from "./composites";
export {
  ActionBar,
  AgentCard,
  CommandPalette,
  ContextMenu,
  DropdownMenu,
  EmptyState,
  IconLabel,
  InlineBanner,
  LazyPanel,
  ListRow,
  StatusLine,
  StepTimeline,
  ViewEmptyState,
} from "./composites";

// ─── Layouts (Tier 4) ─────────────────────────────────────
export { PanelLayout, ScrollArea, StickyHeader } from "./layouts";

// ─── Standalone components ───────────────────────────────
export { StatusIcon } from "./StatusIcon";

// ─── Utilities ────────────────────────────────────────────
export { cn, disabledStyles, focusRing, interactiveBase } from "./variants";

// ─── Tokens (Tier 0) ─────────────────────────────────────
export {
  animDuration,
  COPY_FEEDBACK_MS,
  duration,
  easing,
  fontSize,
  statusBg,
  statusBgSubtle,
  statusColor,
  zIndex,
} from "./tokens";

// ─── Status mappings ─────────────────────────────────────
export {
  FILE_CHANGE_STATUS_COLOR,
  FILE_CHANGE_STATUS_ICON,
  GATE_STATUS_COLOR,
  GATE_STATUS_ICON,
  PRIORITY_VARIANTS,
  RISK_BG_COLOR,
  RISK_ICON_COLOR,
  RISK_TEXT_COLOR,
  STATUS_COLORS,
  STATUS_ICONS,
} from "./statusMappings";

// ─── Types ────────────────────────────────────────────────
// Composites
export type { CommandPaletteGroup, CommandPaletteItem, CommandPaletteProps } from "./composites";
export type { DropdownMenuItem, DropdownMenuProps } from "./composites";
export type { LazyPanelProps } from "./composites";
export type { AgentCardProps } from "./composites";
export type { Step, StepStatus, StepTimelineProps } from "./composites";
export type { ViewEmptyStateProps } from "./composites";
// Primitives
export type { AccordionItem, AccordionProps } from "./primitives";
export type { AlertDialogProps } from "./primitives";
export type { BadgeProps } from "./primitives";
export type { BarChartProps } from "./primitives";
export type { BottomSheetProps, BottomSheetSnapPoint } from "./primitives";
export type { BreadcrumbItem, BreadcrumbsProps } from "./primitives";
export type { ButtonProps } from "./primitives";
export type { CheckboxProps } from "./primitives";
export type { CodeBlockActionsProps } from "./primitives";
export type { CollapsibleProps } from "./primitives";
export type { ConfirmDialogProps } from "./primitives";
export type { DialogProps } from "./primitives";
export type { ErrorBoundaryProps } from "./primitives";
export type { FeaturePanelProps } from "./primitives";
export type { FormFieldProps } from "./primitives";
export type { HighlightedTextProps } from "./primitives";
export type { HoverCardPlacement, HoverCardProps } from "./primitives";
export type { IconProps } from "./primitives";
export type { InputProps } from "./primitives";
export type { KbdProps } from "./primitives";
export type { ModalOverlayProps } from "./primitives";
export type { OverlayPortalProps } from "./primitives";
export type { PaginationProps } from "./primitives";
export type { PopoverAlign, PopoverPlacement, PopoverProps } from "./primitives";
export type { ProgressBarProps } from "./primitives";
export type { RadioGroupProps, RadioOption } from "./primitives";
export type { SegmentedControlProps, SegmentedOption } from "./primitives";
export type { SelectOption, SelectProps } from "./primitives";
export type { SeparatorProps } from "./primitives";
export type { SkeletonProps, SkeletonVariant } from "./primitives";
export type { SlideDrawerProps } from "./primitives";
export type { SlotProps } from "./primitives";
export type { SpinnerProps } from "./primitives";
export type { StatusDotProps } from "./primitives";
export type { StreamingCursorProps } from "./primitives";
export type { SwitchProps } from "./primitives";
export type { TabItem, TabsProps } from "./primitives";
export type { TextProps } from "./primitives";
export type { TextareaProps } from "./primitives";
export type { ThinkingIndicatorProps } from "./primitives";
export type { ToastContainerProps, ToastData, ToastVariant } from "./primitives";
export type { ToolbarButtonProps } from "./primitives";
export type { TooltipProps } from "./primitives";
export type { VisuallyHiddenProps } from "./primitives";
export type { WaveformBarProps } from "./primitives";

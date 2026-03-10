import React, { useCallback } from "react";
import { useAtom } from "jotai";

import { useSendMessage } from "~shared/bootstrap/send-message";

import { demoModalOpenAtom } from "../../shared/lib/atoms/dialogAtoms";
import { Button, cn, Dialog, Icon } from "../../shared/ui";

// ── Workflow Data ────────────────────────────────────────────

interface DemoWorkflow {
  readonly id: string;
  readonly icon: string;
  readonly name: string;
  readonly desc: string;
  readonly trigger: string;
}

const DEMO_WORKFLOWS: readonly DemoWorkflow[] = [
  {
    id: "review",
    icon: "code-review",
    name: "Code Review",
    desc: "Inspect code for issues",
    trigger: "review this code",
  },
  {
    id: "bugfix",
    icon: "tools",
    name: "Bug Fix",
    desc: "Trace and fix root cause",
    trigger: "fix the bug",
  },
  {
    id: "refactor",
    icon: "sparkle",
    name: "Refactor",
    desc: "Clean architecture & patterns",
    trigger: "refactor this module",
  },
  {
    id: "test",
    icon: "beaker",
    name: "Test Runner",
    desc: "Run tests & hunt edge cases",
    trigger: "run tests with coverage",
  },
  {
    id: "explain",
    icon: "book",
    name: "Explain",
    desc: "Break down concepts clearly",
    trigger: "explain how this works",
  },
  {
    id: "auto-context",
    icon: "lightbulb",
    name: "Auto Context",
    desc: "Smart-curate relevant files",
    trigger: "find relevant context files",
  },
  {
    id: "background",
    icon: "server-process",
    name: "Background Job",
    desc: "Async task with progress",
    trigger: "run analysis in background",
  },
  {
    id: "replay",
    icon: "debug-step-back",
    name: "Action Replay",
    desc: "Step-by-step turn playback",
    trigger: "replay last turn step by step",
  },
  {
    id: "debate",
    icon: "robot",
    name: "Multi-Agent",
    desc: "Two agents debate approaches",
    trigger: "compare composition vs inheritance",
  },
  {
    id: "rules",
    icon: "law",
    name: "Agent Rules",
    desc: "Load rules & detect violations",
    trigger: "check agent rules compliance",
  },
  {
    id: "security",
    icon: "shield",
    name: "Security Scan",
    desc: "Zero-trust vulnerability scan",
    trigger: "security scan for vulnerabilities",
  },
  {
    id: "cicd",
    icon: "rocket",
    name: "CI/CD",
    desc: "Build, test, deploy pipeline",
    trigger: "deploy to preview",
  },
  {
    id: "speculate",
    icon: "wand",
    name: "Speculative",
    desc: "Predict your next changes",
    trigger: "predict what I need next",
  },
  {
    id: "search",
    icon: "search",
    name: "Search",
    desc: "Find code across codebase",
    trigger: "search for the auth handler",
  },
  {
    id: "plan",
    icon: "map",
    name: "Strategic Plan",
    desc: "Multi-phase implementation",
    trigger: "plan the architecture design",
  },
  {
    id: "onboarding",
    icon: "person",
    name: "Onboarding",
    desc: "Welcome tour & capabilities",
    trigger: "hello",
  },
];

// ── Component ────────────────────────────────────────────────

export const DemoWorkflowModal = React.memo(function DemoWorkflowModal() {
  const [open, setOpen] = useAtom(demoModalOpenAtom);
  const { send } = useSendMessage();

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleSelect = useCallback(
    (workflow: DemoWorkflow) => {
      setOpen(false);
      // Small delay to let the modal close animation finish before sending
      requestAnimationFrame(() => {
        send(workflow.trigger);
      });
    },
    [setOpen, send],
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Demo Workflows"
      description="Select a workflow to experience"
      className="max-w-[520px]"
    >
      <div className="grid grid-cols-4 gap-1.5 mt-2" role="listbox" aria-label="Demo workflows">
        {DEMO_WORKFLOWS.map((wf) => (
          <WorkflowCard key={wf.id} workflow={wf} onSelect={handleSelect} />
        ))}
      </div>
    </Dialog>
  );
});

// ── Card ─────────────────────────────────────────────────────

const WorkflowCard = React.memo(function WorkflowCard({
  workflow,
  onSelect,
}: {
  workflow: DemoWorkflow;
  onSelect: (wf: DemoWorkflow) => void;
}) {
  const handleClick = useCallback(() => onSelect(workflow), [onSelect, workflow]);

  return (
    <Button
      variant="ghost"
      size="sm"
      role="option"
      onClick={handleClick}
      title={workflow.desc}
      aria-label={`${workflow.name}: ${workflow.desc}`}
      data-testid={`demo-wf-${workflow.id}`}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-md",
        "bg-vsc-surface-3 border border-transparent",
        "hover:border-vsc-focus hover:bg-vsc-list-hover",
        "active:bg-vsc-list-active",
        "transition-[color,background-color,border-color] duration-fast",
      )}
    >
      <Icon name={workflow.icon} tokenSize="lg" className="text-vsc-text-secondary" />
      <span className="text-2xs font-medium text-vsc-fg text-center leading-tight mt-0.5 truncate min-w-0 w-full">
        {workflow.name}
      </span>
    </Button>
  );
});

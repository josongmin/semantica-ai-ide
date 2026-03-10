/**
 * WorkflowParamForm — Parameter entry and step preview for a workflow template
 *
 * Renders parameter inputs with validation, a resolved-step preview,
 * and run/cancel actions.
 */

import { memo, useCallback, useMemo, useState } from "react";
import { useSetAtom } from "jotai";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { createExecution, resolveSteps, validateParams } from "../lib/workflowEngine";
import {
  activeWorkflowExecutionAtom,
  advanceWorkflowStepAtom,
  completeWorkflowAtom,
  updateWorkflowStepAtom,
} from "../model/workflowAtoms";
import type { WorkflowParam, WorkflowTemplate } from "../model/workflowTypes";
import { CATEGORY_COLORS } from "./workflowConstants";

// ─── Public Interface ────────────────────────────────────────

export interface WorkflowParamFormProps {
  template: WorkflowTemplate;
  onBack: () => void;
  onExecuteCommand: (command: string, cwd?: string) => void;
}

export const WorkflowParamForm = memo(function WorkflowParamForm({
  template,
  onBack,
  onExecuteCommand,
}: WorkflowParamFormProps) {
  const setActiveExecution = useSetAtom(activeWorkflowExecutionAtom);
  const setAdvanceStep = useSetAtom(advanceWorkflowStepAtom);
  const setUpdateStep = useSetAtom(updateWorkflowStepAtom);
  const setCompleteWorkflow = useSetAtom(completeWorkflowAtom);

  // Initialize params with defaults
  const [params, setParams] = useState<Record<string, string | number | boolean>>(() => {
    const initial: Record<string, string | number | boolean> = {};
    for (const p of template.params) {
      if (p.default !== undefined) initial[p.name] = p.default;
    }
    return initial;
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleParamChange = useCallback((name: string, value: string | number | boolean) => {
    setParams((prev) => ({ ...prev, [name]: value }));
    setErrors([]);
  }, []);

  const handleRun = useCallback(() => {
    const validationErrors = validateParams(template, params);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const execution = createExecution(template, params);
    setActiveExecution(execution);

    // Execute steps sequentially
    const resolvedSteps = resolveSteps(template.steps, params);
    let stepIndex = 0;

    const runNextStep = () => {
      if (stepIndex >= resolvedSteps.length) {
        setCompleteWorkflow("completed");
        return;
      }

      const step = resolvedSteps[stepIndex];
      if (step === undefined) return;
      setUpdateStep({ stepId: step.id, status: "running" });

      // Delegate command execution to the parent
      onExecuteCommand(step.command, step.cwd);

      // Mark step as succeeded (the parent handles actual execution)
      // In a real integration, this would be triggered by command completion events
      setTimeout(() => {
        setUpdateStep({ stepId: step.id, status: "succeeded" });
        stepIndex++;
        if (stepIndex < resolvedSteps.length) {
          setAdvanceStep();
        }
        runNextStep();
      }, 100);
    };

    runNextStep();
  }, [template, params, setActiveExecution, setUpdateStep, setAdvanceStep, setCompleteWorkflow, onExecuteCommand]);

  // Preview resolved steps
  const previewSteps = useMemo(
    () => resolveSteps(template.steps, params),
    [template.steps, params],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border/30 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 p-0.5 rounded hover:bg-vsc-surface-2 transition-colors duration-100"
          aria-label="Back to templates"
        >
          <Icon name="arrow-left" size={14} className="text-vsc-text-secondary" />
        </button>
        <Icon
          name={template.icon}
          size={14}
          className={CATEGORY_COLORS[template.category] ?? "text-vsc-text-ghost"}
        />
        <span className="text-2xs font-medium text-vsc-fg truncate">{template.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-4">
        {/* Description */}
        <p className="text-2xs text-vsc-text-secondary leading-relaxed">
          {template.description}
        </p>

        {/* Params */}
        {template.params.length > 0 && (
          <div className="space-y-3">
            <div className="text-3xs font-medium text-vsc-text-ghost uppercase tracking-wider">
              Parameters
            </div>
            {template.params.map((param) => (
              <ParamInput
                key={param.name}
                param={param}
                value={params[param.name]}
                onChange={(v) => handleParamChange(param.name, v)}
              />
            ))}
          </div>
        )}

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="space-y-1">
            {errors.map((err) => (
              <div
                key={err}
                className="flex items-center gap-1.5 text-3xs text-vsc-error"
              >
                <Icon name="error" size={11} />
                {err}
              </div>
            ))}
          </div>
        )}

        {/* Step preview */}
        <div className="space-y-1.5">
          <div className="text-3xs font-medium text-vsc-text-ghost uppercase tracking-wider">
            Steps Preview
          </div>
          {previewSteps.map((step, i) => (
            <div
              key={step.id}
              className="flex items-start gap-2 px-2 py-1.5 rounded bg-vsc-surface-2/50"
            >
              <span className="shrink-0 w-4 h-4 rounded-full bg-vsc-surface-1 border border-vsc-border/40 flex items-center justify-center text-3xs text-vsc-text-ghost tabular-nums mt-px">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-3xs text-vsc-text-secondary">{step.label}</div>
                <code className="text-3xs text-vsc-fg/80 font-mono break-all">
                  {step.command}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-vsc-border/30 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "px-3 py-1.5 rounded text-2xs font-medium",
            "text-vsc-text-secondary hover:text-vsc-fg",
            "bg-vsc-surface-2 hover:bg-vsc-surface-2/80",
            "transition-colors duration-100",
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleRun}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-2xs font-medium",
            "text-white bg-vsc-accent hover:bg-vsc-accent/90",
            "transition-colors duration-100",
            "focus-ring",
          )}
        >
          <Icon name="play" size={12} />
          Run Workflow
        </button>
      </div>
    </div>
  );
});

// ─── Param Input (internal) ─────────────────────────────────

interface ParamInputProps {
  param: WorkflowParam;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}

const ParamInput = memo(function ParamInput({ param, value, onChange }: ParamInputProps) {
  const id = `wf-param-${param.name}`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-center gap-1 text-2xs text-vsc-text-secondary">
        {param.label}
        {param.required !== false && <span className="text-vsc-error">*</span>}
      </label>
      {param.description && (
        <p className="text-3xs text-vsc-text-ghost">{param.description}</p>
      )}

      <ParamField param={param} value={value} onChange={onChange} id={id} />
    </div>
  );
});

// ─── Param Field (internal) ─────────────────────────────────

function ParamField({
  param,
  value,
  onChange,
  id,
}: {
  param: WorkflowParam;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
  id: string;
}) {
  const effective = value ?? param.default ?? false;
  const isChecked = effective === true || effective === "true";

  if (param.type === "select" && param.options) {
    return (
      <select
        id={id}
        value={String(value ?? param.default ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-2 py-1.5 rounded text-2xs font-mono",
          "bg-vsc-surface-2 text-vsc-fg border border-vsc-border/40",
          "outline-none focus:border-vsc-accent/60",
          "transition-colors duration-100",
        )}
      >
        {param.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (param.type === "boolean") {
    return (
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={isChecked}
        onClick={() => onChange(!isChecked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full",
          "transition-colors duration-200",
          "border border-vsc-border/40",
          isChecked ? "bg-vsc-accent" : "bg-vsc-surface-2",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            isChecked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    );
  }

  if (param.type === "number") {
    return (
      <input
        id={id}
        type="number"
        value={String(value ?? param.default ?? "")}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={param.placeholder}
        className={cn(
          "w-full px-2 py-1.5 rounded text-2xs font-mono",
          "bg-vsc-surface-2 text-vsc-fg border border-vsc-border/40",
          "outline-none focus:border-vsc-accent/60",
          "placeholder:text-vsc-text-ghost/50",
          "transition-colors duration-100",
        )}
      />
    );
  }

  return (
    <input
      id={id}
      type="text"
      value={String(value ?? param.default ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={param.placeholder}
      className={cn(
        "w-full px-2 py-1.5 rounded text-2xs font-mono",
        "bg-vsc-surface-2 text-vsc-fg border border-vsc-border/40",
        "outline-none focus:border-vsc-accent/60",
        "placeholder:text-vsc-text-ghost/50",
        "transition-colors duration-100",
      )}
    />
  );
}

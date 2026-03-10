/**
 * Workflow Engine — RFC-TERMINAL-018 §6
 *
 * Handles template interpolation, condition evaluation, and step execution sequencing.
 * Actual command execution is delegated to a callback — the engine is execution-agnostic.
 */

import type {
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepState,
  WorkflowTemplate,
} from "../model/workflowTypes";

// ─── Template Interpolation ──────────────────────────────────

/**
 * Replace `{{param}}` placeholders with values.
 * Also supports `{{param|default}}` fallback syntax.
 */
export function interpolateTemplate(
  template: string,
  params: Record<string, string | number | boolean>,
): string {
  return template.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (_match, name: string, fallback?: string) => {
    const value = params[name];
    if (value !== undefined && value !== "") return String(value);
    if (fallback !== undefined) return fallback;
    return "";
  });
}

// ─── Condition Evaluation ────────────────────────────────────

/**
 * Evaluate simple conditions:
 * - `{{param}} == "value"` — equality check
 * - `{{param}} != "value"` — inequality check
 * - `{{param}}` — truthy check for booleans
 */
export function evaluateCondition(
  condition: string,
  params: Record<string, string | number | boolean>,
): boolean {
  const trimmed = condition.trim();

  // Equality check: {{param}} == "value"
  const eqMatch = /^\{\{(\w+)\}\}\s*==\s*"([^"]*)"$/.exec(trimmed);
  if (eqMatch) {
    const [, name, expected] = eqMatch;
    return String(params[name ?? ""] ?? "") === expected;
  }

  // Inequality check: {{param}} != "value"
  const neqMatch = /^\{\{(\w+)\}\}\s*!=\s*"([^"]*)"$/.exec(trimmed);
  if (neqMatch) {
    const [, name, expected] = neqMatch;
    return String(params[name ?? ""] ?? "") !== expected;
  }

  // Truthy check: {{param}}
  const truthyMatch = /^\{\{(\w+)\}\}$/.exec(trimmed);
  if (truthyMatch) {
    const [, name] = truthyMatch;
    if (name === undefined) return false;
    const value = params[name];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") return value !== "" && value !== "false";
    return false;
  }

  // Unrecognised condition — treat as truthy to be safe
  return true;
}

// ─── Step Resolution ─────────────────────────────────────────

/**
 * Filter steps by condition, interpolate commands and cwds.
 * Returns only steps that should run given the current params.
 */
export function resolveSteps(
  steps: readonly WorkflowStep[],
  params: Record<string, string | number | boolean>,
): WorkflowStep[] {
  const resolved: WorkflowStep[] = [];

  for (const step of steps) {
    // Evaluate condition — skip if falsy
    if (step.condition && !evaluateCondition(step.condition, params)) {
      continue;
    }

    resolved.push({
      ...step,
      command: interpolateTemplate(step.command, params),
      cwd: step.cwd ? interpolateTemplate(step.cwd, params) : undefined,
    });
  }

  return resolved;
}

// ─── Param Validation ────────────────────────────────────────

/**
 * Validate params against a template's param definitions.
 * Returns an array of error messages (empty = valid).
 */
export function validateParams(
  template: WorkflowTemplate,
  params: Record<string, string | number | boolean>,
): string[] {
  const errors: string[] = [];

  for (const def of template.params) {
    const value = params[def.name];

    // Required check
    if (def.required !== false && value === undefined && def.default === undefined) {
      errors.push(`Parameter "${def.label}" is required`);
      continue;
    }

    const effective = value ?? def.default;
    if (effective === undefined) continue;

    // Type checks
    switch (def.type) {
      case "select":
        if (def.options && !def.options.includes(String(effective))) {
          errors.push(`"${def.label}" must be one of: ${def.options.join(", ")}`);
        }
        break;
      case "number":
        if (typeof effective === "string" && isNaN(Number(effective))) {
          errors.push(`"${def.label}" must be a valid number`);
        }
        break;
      case "boolean":
        if (typeof effective === "string" && effective !== "true" && effective !== "false") {
          errors.push(`"${def.label}" must be true or false`);
        }
        break;
      case "string":
        // No validation needed for string type
        break;
    }
  }

  return errors;
}

// ─── Execution Factory ──────────────────────────────────────

let executionCounter = 0;

/**
 * Create the initial execution state for a workflow run.
 */
export function createExecution(
  template: WorkflowTemplate,
  params: Record<string, string | number | boolean>,
): WorkflowExecution {
  const resolved = resolveSteps(template.steps, params);

  const stepStates: WorkflowStepState[] = resolved.map((step) => ({
    stepId: step.id,
    status: "pending",
  }));

  return {
    executionId: `wf-exec-${Date.now()}-${++executionCounter}`,
    templateId: template.id,
    templateName: template.name,
    status: "running",
    params,
    stepStates,
    currentStepIndex: 0,
    startedAt: Date.now(),
  };
}

// ─── Built-in Workflows ─────────────────────────────────────

export const BUILTIN_WORKFLOWS: readonly WorkflowTemplate[] = [
  // 1. Full Build & Test
  {
    id: "builtin:full-build-test",
    name: "Full Build & Test",
    description: "Clean install dependencies, build the project, and run the test suite.",
    icon: "rocket",
    category: "build",
    tags: ["ci", "build", "test"],
    author: "Semantica",
    version: "1.0.0",
    params: [
      {
        name: "pm",
        label: "Package Manager",
        type: "select",
        options: ["npm", "pnpm", "yarn", "bun"],
        default: "npm",
        required: true,
      },
    ],
    steps: [
      { id: "install", label: "Install dependencies", command: "{{pm}} ci" },
      { id: "build", label: "Build project", command: "{{pm}} run build" },
      { id: "test", label: "Run tests", command: "{{pm}} test" },
    ],
  },

  // 2. Git Feature Branch
  {
    id: "builtin:git-feature-branch",
    name: "Git Feature Branch",
    description: "Create a new feature branch and push it to origin.",
    icon: "git-branch",
    category: "git",
    tags: ["git", "branch", "feature"],
    author: "Semantica",
    version: "1.0.0",
    params: [
      {
        name: "branch",
        label: "Branch Name",
        type: "string",
        required: true,
        placeholder: "feat/my-feature",
        description: "Name for the new feature branch",
      },
    ],
    steps: [
      { id: "checkout", label: "Create branch", command: "git checkout -b {{branch}}" },
      { id: "push", label: "Push to origin", command: "git push -u origin {{branch}}" },
    ],
  },

  // 3. Git Stash & Pull
  {
    id: "builtin:git-stash-pull",
    name: "Git Stash & Pull",
    description: "Stash local changes, pull latest with rebase, and restore stash.",
    icon: "cloud-download",
    category: "git",
    tags: ["git", "pull", "stash", "rebase"],
    author: "Semantica",
    version: "1.0.0",
    params: [],
    steps: [
      { id: "stash", label: "Stash changes", command: "git stash" },
      { id: "pull", label: "Pull with rebase", command: "git pull --rebase" },
      { id: "pop", label: "Restore stash", command: "git stash pop", continueOnError: true },
    ],
  },

  // 4. Lint & Fix
  {
    id: "builtin:lint-fix",
    name: "Lint & Fix",
    description: "Run the linter and optionally auto-fix issues.",
    icon: "checklist",
    category: "dev",
    tags: ["lint", "fix", "code-quality"],
    author: "Semantica",
    version: "1.0.0",
    params: [
      {
        name: "pm",
        label: "Package Manager",
        type: "select",
        options: ["npm", "pnpm", "yarn", "bun"],
        default: "npm",
        required: true,
      },
      {
        name: "autoFix",
        label: "Auto-fix",
        type: "boolean",
        default: true,
        description: "Automatically fix fixable issues",
      },
    ],
    steps: [
      { id: "lint", label: "Run linter", command: "{{pm}} run lint" },
      {
        id: "fix",
        label: "Auto-fix issues",
        command: "{{pm}} run lint -- --fix",
        condition: '{{autoFix}}',
      },
    ],
  },

  // 5. Docker Build & Run
  {
    id: "builtin:docker-build-run",
    name: "Docker Build & Run",
    description: "Build a Docker image and run the container with port mapping.",
    icon: "server-environment",
    category: "deploy",
    tags: ["docker", "container", "deploy"],
    author: "Semantica",
    version: "1.0.0",
    params: [
      {
        name: "tag",
        label: "Image Tag",
        type: "string",
        required: true,
        placeholder: "my-app:latest",
        description: "Docker image tag",
      },
      {
        name: "port",
        label: "Port",
        type: "number",
        default: 3000,
        required: true,
        description: "Port to expose and map",
      },
    ],
    steps: [
      { id: "build", label: "Build image", command: "docker build -t {{tag}} ." },
      {
        id: "run",
        label: "Run container",
        command: "docker run -p {{port}}:{{port}} {{tag}}",
      },
    ],
  },

  // 6. Clean Install
  {
    id: "builtin:clean-install",
    name: "Clean Install",
    description: "Remove node_modules and lockfile, then do a fresh install.",
    icon: "trash",
    category: "dev",
    tags: ["clean", "install", "fresh"],
    author: "Semantica",
    version: "1.0.0",
    params: [
      {
        name: "pm",
        label: "Package Manager",
        type: "select",
        options: ["npm", "pnpm", "yarn", "bun"],
        default: "npm",
        required: true,
      },
      {
        name: "lockfile",
        label: "Lockfile",
        type: "select",
        options: ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"],
        default: "package-lock.json",
        required: true,
      },
    ],
    steps: [
      { id: "rm-modules", label: "Remove node_modules", command: "rm -rf node_modules" },
      { id: "rm-lock", label: "Remove lockfile", command: "rm -f {{lockfile}}" },
      { id: "install", label: "Install dependencies", command: "{{pm}} install" },
    ],
  },

  // 7. Run Tests with Coverage
  {
    id: "builtin:test-coverage",
    name: "Run Tests with Coverage",
    description: "Run the test suite with code coverage and open the report.",
    icon: "beaker",
    category: "test",
    tags: ["test", "coverage", "report"],
    author: "Semantica",
    version: "1.0.0",
    params: [
      {
        name: "pm",
        label: "Package Manager",
        type: "select",
        options: ["npm", "pnpm", "yarn", "bun"],
        default: "npm",
        required: true,
      },
    ],
    steps: [
      {
        id: "test",
        label: "Run tests with coverage",
        command: "{{pm}} run test -- --coverage",
      },
      {
        id: "open",
        label: "Open coverage report",
        command: "open coverage/lcov-report/index.html",
        continueOnError: true,
      },
    ],
  },

  // 8. Deploy Preview
  {
    id: "builtin:deploy-preview",
    name: "Deploy Preview",
    description: "Build the project and deploy a preview to Vercel or Netlify.",
    icon: "cloud-upload",
    category: "deploy",
    tags: ["deploy", "preview", "vercel", "netlify"],
    author: "Semantica",
    version: "1.0.0",
    params: [
      {
        name: "pm",
        label: "Package Manager",
        type: "select",
        options: ["npm", "pnpm", "yarn", "bun"],
        default: "npm",
        required: true,
      },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        options: ["vercel", "netlify"],
        default: "vercel",
        required: true,
        description: "Deployment platform",
      },
    ],
    steps: [
      { id: "build", label: "Build project", command: "{{pm}} run build" },
      {
        id: "deploy-vercel",
        label: "Deploy to Vercel",
        command: "npx vercel --prebuilt",
        condition: '{{platform}} == "vercel"',
      },
      {
        id: "deploy-netlify",
        label: "Deploy to Netlify",
        command: "npx netlify deploy --dir=dist",
        condition: '{{platform}} == "netlify"',
      },
    ],
  },
];

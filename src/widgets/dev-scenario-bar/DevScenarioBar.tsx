import React, { useCallback, useMemo, useRef, useState } from "react";

import { cn, Popover, Tabs } from "../../shared/ui";
import { ScenarioCardButton } from "./ScenarioCardButton";
import { type Scenario,SCENARIOS, TAB_ITEMS } from "./scenarioData";

function getDevSim() {
  return window.__dev?.sim;
}

/** Dev-only popover for pipeline scenario selection. Inline trigger for PromptStatusBar. */
export const DevScenarioPopover = React.memo(function DevScenarioPopover() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Pipeline");
  const runningRef = useRef(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => setOpen((v) => !v), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const scenariosByGroup = useMemo(() => {
    const map = new Map<string, Scenario[]>();
    for (const s of SCENARIOS) {
      const list = map.get(s.group) ?? [];
      list.push(s);
      map.set(s.group, list);
    }
    return map;
  }, []);

  const runScenario = useCallback(async (scenario: Scenario) => {
    if (runningRef.current) return;
    const sim = getDevSim();
    if (!sim) return;
    runningRef.current = true;
    setRunning(scenario.label);
    setOpen(false);
    try {
      const fn = sim[scenario.key];
      if (fn !== undefined) await fn();
    } finally {
      runningRef.current = false;
      setRunning(null);
    }
  }, []);

  const activeScenarios = scenariosByGroup.get(activeTab) ?? [];

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1 text-2xs transition-colors duration-fast cursor-pointer focus-ring rounded px-1 py-0.5",
          running
            ? "text-vsc-warning animate-pulse"
            : "text-vsc-text-secondary hover:text-vsc-text-primary",
        )}
        title="Dev pipeline scenarios"
        data-testid="dev-scenario-trigger"
      >
        <span className="rounded px-1 py-px text-2xs font-bold bg-vsc-warning/20 text-vsc-warning leading-none">
          DEV
        </span>
        {running && <span>{running}...</span>}
      </button>

      <Popover
        open={open}
        onClose={handleClose}
        anchorRef={anchorRef}
        placement="bottom"
        align="start"
        className="w-auto min-w-88 max-w-[calc(100vw-2rem)] p-0"
      >
        <Tabs tabs={TAB_ITEMS} activeId={activeTab} onTabChange={setActiveTab} className="px-1" />
        <div className="px-1 pb-1 max-h-[50vh] overflow-y-auto space-y-0.5">
          {activeScenarios.map((s) => (
            <ScenarioCardButton
              key={s.key}
              scenario={s}
              disabled={running !== null}
              onRun={runScenario}
            />
          ))}
        </div>
      </Popover>
    </>
  );
});

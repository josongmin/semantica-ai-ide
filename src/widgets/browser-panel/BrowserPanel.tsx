import React, { useCallback, useEffect, useState } from "react";

import { useBrowserPreview } from "../../features/browser-preview";
import { Button, Collapsible, Input, Text } from "../../shared/ui";
import { BrowserConsoleRow } from "./BrowserConsoleRow";

export const BrowserPanel = React.memo(function BrowserPanel() {
  const { panelVisible, browserState, consoleEntries, navigate, close } = useBrowserPreview();

  const [urlInput, setUrlInput] = useState(browserState.url);

  // Sync urlInput when browserState.url changes externally
  useEffect(() => {
    setUrlInput(browserState.url);
  }, [browserState.url]);

  const handleNavigate = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    navigate(trimmed);
  }, [urlInput, navigate]);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleNavigate();
      }
    },
    [handleNavigate],
  );

  if (!panelVisible) return null;

  return (
    <div
      className="flex flex-col border-t border-vsc-border bg-vsc-surface-1"
      role="region"
      aria-label="Browser preview"
      data-testid="browser-panel"
    >
      {/* Navigation bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-vsc-border bg-vsc-surface-2">
        <Input
          type="url"
          size="sm"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={handleUrlKeyDown}
          placeholder="https://..."
          className="flex-1 py-0.5"
          aria-label="Browser URL"
          data-testid="url-input"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNavigate}
          disabled={browserState.loading}
          aria-label="Navigate to URL"
          data-testid="go-button"
        >
          Go
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={close}
          aria-label="Close browser"
          data-testid="close-button"
        >
          Close
        </Button>
      </div>

      {/* Screenshot area */}
      <div
        className="relative bg-vsc-surface-3 flex items-center justify-center overflow-hidden"
        style={{ minHeight: "200px", maxHeight: "400px" }}
        data-testid="screenshot-area"
      >
        {browserState.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-vsc-surface-1/80">
            <Text size="xs" tone="tertiary">
              Loading...
            </Text>
          </div>
        )}
        {browserState.screenshot_data_url ? (
          <img
            src={browserState.screenshot_data_url}
            alt={browserState.title ?? "Browser screenshot"}
            className="w-full h-auto object-contain"
            data-testid="browser-screenshot"
          />
        ) : (
          !browserState.loading && (
            <Text size="xs" tone="tertiary">
              {browserState.url ? "Navigating..." : "Enter a URL to browse"}
            </Text>
          )
        )}
      </div>

      {/* Console section */}
      <Collapsible title={`Console (${consoleEntries.length})`} defaultCollapsed={true}>
        <div
          className="overflow-y-auto max-h-[150px] py-0.5"
          role="list"
          aria-label="Browser console"
          data-testid="console-entries"
        >
          {consoleEntries.length === 0 ? (
            <div className="px-3 py-2">
              <Text size="xs" tone="tertiary">
                No console output
              </Text>
            </div>
          ) : (
            consoleEntries.map((entry) => <BrowserConsoleRow key={entry.id} entry={entry} />)
          )}
        </div>
      </Collapsible>
    </div>
  );
});

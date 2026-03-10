import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  filteredPlaybooksAtom,
  playbookCategoriesAtom,
  playbookCategoryFilterAtom,
  playbookSearchQueryAtom,
} from "../../features/playbook-market";
import { getVscodeApi } from "../../shared/lib";
import { playbookMarketOpenAtom } from "../../shared/lib/atoms/dialogAtoms";
import type { PlaybookEntry } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";

// ─── Playbook Card ──────────────────────────────────────────

const PlaybookCard = React.memo(function PlaybookCard({
  entry,
  onInstall,
  onUninstall,
  onApply,
}: {
  entry: PlaybookEntry;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onApply: (id: string) => void;
}) {
  const handleInstallToggle = useCallback(() => {
    if (entry.installed) {
      onUninstall(entry.id);
    } else {
      onInstall(entry.id);
    }
  }, [entry.id, entry.installed, onInstall, onUninstall]);

  const handleApply = useCallback(() => {
    onApply(entry.id);
  }, [entry.id, onApply]);

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 p-2 border border-vsc-border rounded bg-vsc-bg-secondary",
        "hover:border-vsc-focus transition-colors duration-fast",
      )}
      data-testid={`playbook-card-${entry.id}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col flex-1 min-w-0">
          <Text size="xs" weight="medium" className="truncate min-w-0">
            {entry.name}
          </Text>
          <div className="flex items-center gap-1.5">
            <Text size="xs" tone="tertiary">
              v{entry.version}
            </Text>
            <Text size="xs" tone="tertiary">
              by {entry.author}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {entry.installed && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              aria-label={`Use ${entry.name}`}
              data-testid={`playbook-apply-${entry.id}`}
            >
              Use
            </Button>
          )}
          <Button
            variant={entry.installed ? "ghost" : "primary"}
            size="sm"
            onClick={handleInstallToggle}
            aria-label={entry.installed ? `Uninstall ${entry.name}` : `Install ${entry.name}`}
            data-testid={`playbook-toggle-${entry.id}`}
          >
            {entry.installed ? "Uninstall" : "Install"}
          </Button>
        </div>
      </div>
      <Text size="xs" tone="secondary" className="line-clamp-2">
        {entry.description}
      </Text>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1" aria-label={`Rating: ${entry.rating.toFixed(1)}`}>
          <Icon name="star-full" tokenSize="2xs" className="text-vsc-warning" />
          <Text size="xs" tone="tertiary">
            {entry.rating.toFixed(1)}
          </Text>
        </span>
        {entry.category && (
          <span className="px-1 py-0.5 text-2xs bg-vsc-bg rounded text-vsc-text-tertiary">
            {entry.category}
          </span>
        )}
      </div>
    </div>
  );
});

// ─── Main Component ─────────────────────────────────────────

/**
 * PlaybookMarket - Marketplace for agent instructions and playbooks.
 *
 * Displays a searchable grid of playbook cards with install/uninstall/use.
 */
export const PlaybookMarket = React.memo(function PlaybookMarket() {
  const open = useAtomValue(playbookMarketOpenAtom);
  const playbooks = useAtomValue(filteredPlaybooksAtom);
  const categories = useAtomValue(playbookCategoriesAtom);
  const setSearchQuery = useSetAtom(playbookSearchQueryAtom);
  const setCategoryFilter = useSetAtom(playbookCategoryFilterAtom);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery],
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCategoryFilter(e.target.value);
    },
    [setCategoryFilter],
  );

  const handleInstall = useCallback((id: string) => {
    getVscodeApi().postMessage({ type: "INSTALL_PLAYBOOK", playbook_id: id });
  }, []);

  const handleUninstall = useCallback((id: string) => {
    getVscodeApi().postMessage({ type: "UNINSTALL_PLAYBOOK", playbook_id: id });
  }, []);

  const handleApply = useCallback((id: string) => {
    getVscodeApi().postMessage({ type: "APPLY_PLAYBOOK", playbook_id: id });
  }, []);

  if (!open) return null;

  return (
    <div
      className="flex flex-col gap-2 p-2"
      data-testid="playbook-market"
      role="region"
      aria-label="Playbook market"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Icon name="book" tokenSize="sm" />
        <Text size="sm" weight="medium">
          Playbook Market
        </Text>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Icon
            name="search"
            tokenSize="sm"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 text-vsc-text-tertiary pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search playbooks..."
            onChange={handleSearchChange}
            className="w-full pl-6 pr-2 py-1 text-xs bg-vsc-bg-secondary border border-vsc-border rounded text-vsc-text-primary placeholder:text-vsc-text-tertiary focus:outline-none focus:border-vsc-focus"
            data-testid="playbook-search-input"
          />
        </div>
        {categories.length > 0 && (
          <select
            onChange={handleCategoryChange}
            className="px-1.5 py-1 text-xs bg-vsc-bg-secondary border border-vsc-border rounded text-vsc-text-primary focus:outline-none focus:border-vsc-focus"
            data-testid="playbook-category-filter"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid */}
      {playbooks.length === 0 ? (
        <div className="px-2 py-4 text-center" data-testid="playbook-market-empty">
          <Text size="xs" tone="tertiary">
            No playbooks found.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" data-testid="playbook-market-grid">
          {playbooks.map((entry) => (
            <PlaybookCard
              key={entry.id}
              entry={entry}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </div>
  );
});

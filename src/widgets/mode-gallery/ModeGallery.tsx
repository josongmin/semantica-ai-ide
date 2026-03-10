import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  filteredModesAtom,
  modeCategoriesAtom,
  modeCategoryFilterAtom,
  modeSearchQueryAtom,
} from "../../features/mode-gallery";
import { getVscodeApi } from "../../shared/lib";
import { modeGalleryOpenAtom } from "../../shared/lib/atoms/dialogAtoms";
import type { ModeEntry } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";

// ─── Star Rating ─────────────────────────────────────────────

const StarRating = React.memo(function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <span className="flex items-center gap-px" aria-label={`Rating: ${rating.toFixed(1)}`}>
      {/* Static list — index key safe */}
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name={(() => { if (i < fullStars) return "star-full"; if (i === fullStars && hasHalf) return "star-half"; return "star-empty"; })()}
          tokenSize="2xs"
          className={cn(
            i < fullStars || (i === fullStars && hasHalf)
              ? "text-vsc-warning"
              : "text-vsc-text-tertiary",
          )}
        />
      ))}
      <Text size="xs" tone="tertiary" className="ml-0.5">
        {rating.toFixed(1)}
      </Text>
    </span>
  );
});

// ─── Mode Card ───────────────────────────────────────────────

const ModeCard = React.memo(function ModeCard({
  entry,
  onInstall,
  onUninstall,
}: {
  entry: ModeEntry;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
}) {
  const handleToggle = useCallback(() => {
    if (entry.installed) {
      onUninstall(entry.id);
    } else {
      onInstall(entry.id);
    }
  }, [entry.id, entry.installed, onInstall, onUninstall]);

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 p-2 border border-vsc-border rounded bg-vsc-bg-secondary",
        "hover:border-vsc-focus hover:shadow-md transition-[border-color,box-shadow] duration-fast",
      )}
      data-testid={`mode-card-${entry.id}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col flex-1 min-w-0">
          <Text size="xs" weight="medium" className="truncate min-w-0">
            {entry.name}
          </Text>
          <Text size="xs" tone="tertiary">
            by {entry.author}
          </Text>
        </div>
        <Button
          variant={entry.installed ? "ghost" : "primary"}
          size="sm"
          onClick={handleToggle}
          aria-label={entry.installed ? `Uninstall ${entry.name}` : `Install ${entry.name}`}
          data-testid={`mode-toggle-${entry.id}`}
        >
          {entry.installed ? "Uninstall" : "Install"}
        </Button>
      </div>
      <Text size="xs" tone="secondary" className="line-clamp-2">
        {entry.description}
      </Text>
      <div className="flex items-center gap-2">
        <StarRating rating={entry.rating} />
        <Text size="xs" tone="tertiary">
          {formatInstallCount(entry.install_count)}
        </Text>
      </div>
      {entry.categories.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {entry.categories.map((cat) => (
            <span
              key={cat}
              className="px-1 py-0.5 text-2xs bg-vsc-bg rounded text-vsc-text-tertiary"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

function formatInstallCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return `${count}`;
}

// ─── Main Component ─────────────────────────────────────────

/**
 * ModeGallery - Browse and install community workflow modes.
 *
 * Displays a searchable, filterable grid of mode cards.
 */
export const ModeGallery = React.memo(function ModeGallery() {
  const open = useAtomValue(modeGalleryOpenAtom);
  const modes = useAtomValue(filteredModesAtom);
  const categories = useAtomValue(modeCategoriesAtom);
  const setSearchQuery = useSetAtom(modeSearchQueryAtom);
  const setCategoryFilter = useSetAtom(modeCategoryFilterAtom);

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
    getVscodeApi().postMessage({ type: "INSTALL_MODE", mode_id: id });
  }, []);

  const handleUninstall = useCallback((id: string) => {
    getVscodeApi().postMessage({ type: "UNINSTALL_MODE", mode_id: id });
  }, []);

  if (!open) return null;

  return (
    <div
      className="flex flex-col gap-2 p-2"
      data-testid="mode-gallery"
      role="region"
      aria-label="Mode gallery"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Icon name="library" tokenSize="sm" />
        <Text size="sm" weight="medium">
          Mode Gallery
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
            placeholder="Search modes..."
            onChange={handleSearchChange}
            className="w-full pl-6 pr-2 py-1 text-xs bg-vsc-bg-secondary border border-vsc-border rounded text-vsc-text-primary placeholder:text-vsc-text-tertiary focus:outline-none focus:border-vsc-focus"
            data-testid="mode-search-input"
          />
        </div>
        {categories.length > 0 && (
          <select
            onChange={handleCategoryChange}
            className="px-1.5 py-1 text-xs bg-vsc-bg-secondary border border-vsc-border rounded text-vsc-text-primary focus:outline-none focus:border-vsc-focus"
            data-testid="mode-category-filter"
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
      {modes.length === 0 ? (
        <div className="px-2 py-4 text-center" data-testid="mode-gallery-empty">
          <Text size="xs" tone="tertiary">
            No modes found.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" data-testid="mode-gallery-grid">
          {modes.map((entry) => (
            <ModeCard
              key={entry.id}
              entry={entry}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
            />
          ))}
        </div>
      )}
    </div>
  );
});

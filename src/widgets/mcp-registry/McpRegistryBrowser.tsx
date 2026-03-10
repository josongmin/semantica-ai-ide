import React, { useCallback, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import {
  filteredRegistryEntriesAtom,
  registryCategoriesAtom,
  registryCategoryFilterAtom,
  registrySearchQueryAtom,
  toggleMcpInstallAtom,
} from "../../features/mcp-registry";
import { getVscodeApi } from "../../shared/lib";
import { mcpRegistryOpenAtom } from "../../shared/lib/atoms/dialogAtoms";
import type { McpRegistryEntry } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";
import { DetailView } from "./DetailView";
import { ServerCard } from "./ServerCard";

/**
 * McpRegistryBrowser: Browse and install MCP servers.
 * Features a search bar, category filter, server cards, and detail view.
 */
export const McpRegistryBrowser = React.memo(function McpRegistryBrowser() {
  const open = useAtomValue(mcpRegistryOpenAtom);
  const entries = useAtomValue(filteredRegistryEntriesAtom);
  const categories = useAtomValue(registryCategoriesAtom);
  const [searchQuery, setSearchQuery] = useAtom(registrySearchQueryAtom);
  const [categoryFilter, setCategoryFilter] = useAtom(registryCategoryFilterAtom);
  const toggleInstall = useSetAtom(toggleMcpInstallAtom);
  const [selectedEntry, setSelectedEntry] = useState<McpRegistryEntry | null>(null);

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

  const handleToggleInstall = useCallback(
    (serverId: string) => {
      toggleInstall(serverId);
      // Notify extension host
      const entry = entries.find((e) => e.id === serverId);
      if (entry) {
        const api = getVscodeApi();
        if (entry.installed) {
          api.postMessage({ type: "UNINSTALL_MCP_SERVER", server_id: serverId });
        } else {
          api.postMessage({ type: "INSTALL_MCP_SERVER", server_id: serverId });
        }
      }
    },
    [entries, toggleInstall],
  );

  const handleSelectEntry = useCallback((entry: McpRegistryEntry) => {
    setSelectedEntry(entry);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  if (!open) return null;

  // If a detail view is selected, show it
  if (selectedEntry) {
    // Get the latest version from entries (in case install status changed)
    const latestEntry = entries.find((e) => e.id === selectedEntry.id) ?? selectedEntry;
    return (
      <div className="flex flex-col gap-2 p-2" data-testid="mcp-registry-browser">
        <DetailView entry={latestEntry} onBack={handleBack} onToggleInstall={handleToggleInstall} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2" data-testid="mcp-registry-browser">
      {/* Search + Filter bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Icon
            name="search"
            tokenSize="2xs"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-vsc-text-tertiary pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search MCP servers..."
            className={cn(
              "w-full pl-7 pr-2 py-1.5 text-xs rounded-md",
              "bg-vsc-input border border-vsc-border",
              "text-vsc-text-primary placeholder:text-vsc-text-tertiary",
              "focus:outline-none focus:border-vsc-focus",
            )}
            aria-label="Search MCP servers"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={handleCategoryChange}
          className={cn(
            "px-2 py-1.5 text-xs rounded-md",
            "bg-vsc-input border border-vsc-border",
            "text-vsc-text-primary",
            "focus:outline-none focus:border-vsc-focus",
          )}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Icon name="search" tokenSize="sm" className="text-vsc-text-tertiary" />
          <Text size="xs" tone="tertiary">
            No MCP servers found
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-2" role="list" aria-label="MCP server registry">
          {entries.map((entry) => (
            <div key={entry.id} role="listitem">
              <ServerCard
                entry={entry}
                onToggleInstall={handleToggleInstall}
                onSelect={handleSelectEntry}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

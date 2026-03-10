import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setMcpRegistryAtom } from "../../../features/mcp-registry";
import { mcpRegistryOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";
import { createMcpRegistryEntry, resetIdCounter } from "../../../shared/lib/mocks";
import { McpRegistryBrowser } from "../McpRegistryBrowser";

beforeEach(() => {
  resetIdCounter();
});

describe("McpRegistryBrowser", () => {
  it("renders empty state when no entries exist", () => {
    renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    expect(screen.getByTestId("mcp-registry-browser")).toBeInTheDocument();
    expect(screen.getByText("No MCP servers found")).toBeInTheDocument();
  });

  it("renders server cards when entries exist", () => {
    const { store } = renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    act(() => {
      store.set(setMcpRegistryAtom, [
        createMcpRegistryEntry({ id: "srv1", name: "Code Analyzer", author: "Alice" }),
        createMcpRegistryEntry({ id: "srv2", name: "Test Runner", author: "Bob" }),
      ]);
    });

    expect(screen.getByTestId("mcp-server-card-srv1")).toBeInTheDocument();
    expect(screen.getByTestId("mcp-server-card-srv2")).toBeInTheDocument();
    expect(screen.getByText("Code Analyzer")).toBeInTheDocument();
    expect(screen.getByText("Test Runner")).toBeInTheDocument();
  });

  it("shows install status on cards", () => {
    const { store } = renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    act(() => {
      store.set(setMcpRegistryAtom, [
        createMcpRegistryEntry({ id: "srv1", name: "Server A", installed: true }),
        createMcpRegistryEntry({ id: "srv2", name: "Server B", installed: false }),
      ]);
    });

    expect(screen.getByText("Installed")).toBeInTheDocument();
    expect(screen.getByText("Install")).toBeInTheDocument();
  });

  it("shows author on server cards", () => {
    const { store } = renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    act(() => {
      store.set(setMcpRegistryAtom, [
        createMcpRegistryEntry({ id: "srv1", name: "Server", author: "TestAuthor" }),
      ]);
    });

    expect(screen.getByText("by TestAuthor")).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    const { store, user } = renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    act(() => {
      store.set(setMcpRegistryAtom, [
        createMcpRegistryEntry({ id: "srv1", name: "Code Analyzer" }),
        createMcpRegistryEntry({ id: "srv2", name: "Test Runner" }),
      ]);
    });

    const searchInput = screen.getByLabelText("Search MCP servers");
    await user.type(searchInput, "analyzer");

    expect(screen.getByText("Code Analyzer")).toBeInTheDocument();
    expect(screen.queryByText("Test Runner")).not.toBeInTheDocument();
  });

  it("shows category badges on cards", () => {
    const { store } = renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    act(() => {
      store.set(setMcpRegistryAtom, [
        createMcpRegistryEntry({
          id: "srv1",
          name: "Server",
          categories: ["tools", "testing"],
        }),
      ]);
    });

    // "tools" and "testing" appear as both Badge elements and select options
    expect(screen.getAllByText("tools").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("testing").length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to detail view when card is clicked", async () => {
    const { store, user } = renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    act(() => {
      store.set(setMcpRegistryAtom, [
        createMcpRegistryEntry({
          id: "srv1",
          name: "Awesome Server",
          description: "A very detailed description of the server",
          compatibility: ">=2.0.0",
        }),
      ]);
    });

    const card = screen.getByTestId("mcp-server-card-srv1");
    await user.click(card);

    expect(screen.getByTestId("mcp-registry-detail")).toBeInTheDocument();
    expect(screen.getByText("Awesome Server")).toBeInTheDocument();
    expect(screen.getByText("Compatibility: >=2.0.0")).toBeInTheDocument();
  });

  it("navigates back from detail view", async () => {
    const { store, user } = renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    act(() => {
      store.set(setMcpRegistryAtom, [createMcpRegistryEntry({ id: "srv1", name: "Server" })]);
    });

    // Go to detail
    const card = screen.getByTestId("mcp-server-card-srv1");
    await user.click(card);
    expect(screen.getByTestId("mcp-registry-detail")).toBeInTheDocument();

    // Go back
    const backBtn = screen.getByLabelText("Back to registry list");
    await user.click(backBtn);
    expect(screen.queryByTestId("mcp-registry-detail")).not.toBeInTheDocument();
  });

  it("has search input and category filter", () => {
    renderWithAtoms(<McpRegistryBrowser />, { initialValues: [[mcpRegistryOpenAtom, true]] });

    expect(screen.getByLabelText("Search MCP servers")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by category")).toBeInTheDocument();
  });
});

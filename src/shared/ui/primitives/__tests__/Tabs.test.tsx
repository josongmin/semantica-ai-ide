import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { type TabItem, Tabs } from "../Tabs";

describe("Tabs", () => {
  const onTabChange = vi.fn();
  const tabs: TabItem[] = [
    { id: "output", label: "Output" },
    { id: "json", label: "JSON" },
    { id: "logs", label: "Logs" },
  ];

  beforeEach(() => {
    onTabChange.mockClear();
  });

  const renderTabs = (props: Partial<React.ComponentProps<typeof Tabs>> = {}) =>
    render(<Tabs tabs={tabs} activeId="output" onTabChange={onTabChange} {...props} />);

  it("renders all tabs", () => {
    renderTabs();
    expect(screen.getByText("Output")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByText("Logs")).toBeInTheDocument();
  });

  it("has role=tablist", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("tabs have role=tab", () => {
    renderTabs();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("active tab has aria-selected=true", () => {
    renderTabs({ activeId: "json" });
    expect(screen.getByText("JSON")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Output")).toHaveAttribute("aria-selected", "false");
  });

  it("active tab has tabIndex=0, others have tabIndex=-1", () => {
    renderTabs({ activeId: "output" });
    expect(screen.getByText("Output")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("JSON")).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("Logs")).toHaveAttribute("tabindex", "-1");
  });

  it("click on tab calls onTabChange", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByText("JSON"));
    expect(onTabChange).toHaveBeenCalledWith("json");
  });

  it("ArrowRight navigates to next tab", async () => {
    const user = userEvent.setup();
    renderTabs({ activeId: "output" });

    screen.getByText("Output").focus();
    await user.keyboard("{ArrowRight}");

    expect(onTabChange).toHaveBeenCalledWith("json");
  });

  it("ArrowLeft navigates to previous tab", async () => {
    const user = userEvent.setup();
    renderTabs({ activeId: "json" });

    screen.getByText("JSON").focus();
    await user.keyboard("{ArrowLeft}");

    expect(onTabChange).toHaveBeenCalledWith("output");
  });

  it("ArrowRight wraps from last to first", async () => {
    const user = userEvent.setup();
    renderTabs({ activeId: "logs" });

    screen.getByText("Logs").focus();
    await user.keyboard("{ArrowRight}");

    expect(onTabChange).toHaveBeenCalledWith("output");
  });

  it("ArrowLeft wraps from first to last", async () => {
    const user = userEvent.setup();
    renderTabs({ activeId: "output" });

    screen.getByText("Output").focus();
    await user.keyboard("{ArrowLeft}");

    expect(onTabChange).toHaveBeenCalledWith("logs");
  });

  it("Home goes to first tab", async () => {
    const user = userEvent.setup();
    renderTabs({ activeId: "logs" });

    screen.getByText("Logs").focus();
    await user.keyboard("{Home}");

    expect(onTabChange).toHaveBeenCalledWith("output");
  });

  it("End goes to last tab", async () => {
    const user = userEvent.setup();
    renderTabs({ activeId: "output" });

    screen.getByText("Output").focus();
    await user.keyboard("{End}");

    expect(onTabChange).toHaveBeenCalledWith("logs");
  });

  it("disabled tab is rendered with disabled attribute", () => {
    const tabsWithDisabled: TabItem[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
    ];
    render(<Tabs tabs={tabsWithDisabled} activeId="a" onTabChange={onTabChange} />);
    expect(screen.getByText("B")).toBeDisabled();
  });

  it("keyboard navigation skips disabled tabs", async () => {
    const user = userEvent.setup();
    const tabsWithDisabled: TabItem[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
      { id: "c", label: "C" },
    ];
    render(<Tabs tabs={tabsWithDisabled} activeId="a" onTabChange={onTabChange} />);

    screen.getByText("A").focus();
    await user.keyboard("{ArrowRight}");

    expect(onTabChange).toHaveBeenCalledWith("c");
  });

  it("has aria-orientation=horizontal", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
  });
});
